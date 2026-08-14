import { Router } from 'express'
import { getAccessToken, getDevices, thirdpartyDevice, updateThirdpartyDevice } from '../services/ihost.ts'
import { buildEndpoint } from '../utils/buildEndpoint/index.ts'
import { deleteMapping, getAllMapping, getMapping, saveMapping } from '../db/index.ts'
import { addSseClient, pushSse, removeSseClient } from '../services/sse.ts'

export const thirdpartyRouter = Router()

// 拦截 open-api/access_token
thirdpartyRouter.post('/open-api/access_token', async (req, res, next) => {
  try {
    const { iHost, password, app_name } = req.body ?? {};
    const accessToken = await getAccessToken(iHost, password, app_name);

    res.json({ status: 'ok', data: { access_token: accessToken } });
  } catch (err) {
    next(err);
  }
})

// 同步设备 /open-api/thirdparty/event
thirdpartyRouter.post('/open-api/thirdparty/event', async (req, res, next) => {
  try {
    const { eWeLinkEvent, at, iHost } = req.body ?? {};
    const uiid = eWeLinkEvent.extra.uiid
    const device = buildEndpoint[uiid as keyof typeof buildEndpoint].buildEndpointUIID7017(eWeLinkEvent);
    const data: any = await thirdpartyDevice(device, at, iHost);
    // 存eWeLink deviceid --- iHost serial_number
    const ewelinkDeviceId = data?.payload?.endpoints?.[0].third_serial_number;
    const ihostSerial = data?.payload?.endpoints?.[0].serial_number;
    if (ewelinkDeviceId && ihostSerial) {
      saveMapping(ewelinkDeviceId, ihostSerial, String(uiid));
    }

    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
})

// 设备状态更新
thirdpartyRouter.post('/open-api/device', async (req, res, next) => {
  try {
    const { params, deviceId, at, iHost } = req.body ?? {};
    const mapping = getMapping(deviceId);
    const serial_number = mapping?.ihost_serial as string;
    const state = buildEndpoint[mapping?.uiid as keyof typeof buildEndpoint]?.paramsToIHostState(params);
    const data: any = await updateThirdpartyDevice(state, serial_number, deviceId, at, iHost);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
})

// ihost 网关推送的状态变更
thirdpartyRouter.post('/open-api/device/:deviceId', async (req, res, next) => {
  try {
    const { directive: { header, endpoint, payload } } = req.body ?? {};
    if (header.name === 'UpdateDeviceStates') {
      const mapping = getMapping(endpoint.third_serial_number);
      const uiid = mapping?.uiid as string;
      const params = buildEndpoint[uiid as keyof typeof buildEndpoint].stateToParams(payload.state);
      // SSE 推给前端，前端 eWeLink WS 下发控制指令
      pushSse('device-control', { deviceid: endpoint.third_serial_number, params });
      res.json({
        "event": {
          "header": {
            "name": "Response",
            "message_id": "Unique identifier, preferably a version 4 UUID",
            "version": "2"
          },
          "payload": {
            "endpoints": [
              {
                "serial_number": mapping?.ihost_serial,
                "third_serial_number": mapping?.device_id
              }
            ]
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
})

// SSE连接用于处理 iHost 回调
thirdpartyRouter.get('/open-api/events', (req, res) => {
  // const user = req.query.user as string;  
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  addSseClient(res)
  // heartbeat
  const heartbeat = setInterval(() => res.write(': keep-alive\n'), 30000)
  req.on('close', () => {
    clearInterval(heartbeat)
    removeSseClient(res)
  })
})

// 返回所有映射 (判断是否同步)
thirdpartyRouter.post('/open-api/thirdparty-map', async (req, res, next) => {
  try {
    const { iHost, at, } = req.body ?? {};
    // 本地映射表
    const allMap = getAllMapping();
    // iHost 当前设备列表
    const devices = await getDevices(iHost, at);
    const deviceList = devices?.data.device_list ?? [];

    // iHost 存在的 thirdparty 设备
    const ihostSerials = new Set<string>();
    for (const d of deviceList) {
      if (d.third_serial_number) {
        ihostSerials.add(d.serial_number);
      }
    }
    // map 表中进行同步移除
    allMap.forEach((m) => {
      if (!ihostSerials.has(m.ihost_serial)) {
        deleteMapping(m.device_id)
      }
    })
    const newMap = getAllMapping();
    res.json({ status: 'ok', data: { newMap } });
  } catch (err) {
    next(err);
  }
})
