import { Router } from 'express'
import { getAccessToken, getDevices, thirdpartyDevice, updateThirdpartyDevice } from '../services/ihost.ts'
import { buildEndpoint } from '../utils/buildEndpoint/index.ts'
import { deleteMapping, getAllMapping, getIHostCred, getMapping, saveIHostCred, saveMapping } from '../db/index.ts'
import * as ewelinkWs from '../services/ewelinkWs.ts'

export const thirdpartyRouter = Router()

// 拦截 open-api/access_token
thirdpartyRouter.post('/open-api/access_token', async (req, res, next) => {
  try {
    const { iHost, app_name } = req.body ?? {};
    // 客户端断开/取消时中止轮询（前端重新请求会 abort 上一个）
    let aborted = false
    res.on('close', () => { aborted = true })

    const accessToken = await getAccessToken(iHost, app_name, () => aborted);
    if (aborted) return // 客户端已断开，不再响应
    // 保存 iHost 凭据
    const token = accessToken;
    if (token && iHost) saveIHostCred(token, iHost);

    res.json({ status: 'ok', data: { access_token: accessToken } });
  } catch (err) {
    // 请求被取消（客户端断开）时静默返回
    if ((err as Error)?.message === 'ABORTED') return
    next(err);
  }
})

// 同步设备 /open-api/thirdparty/event
thirdpartyRouter.post('/open-api/thirdparty/event', async (req, res, next) => {
  try {
    const { eWeLinkEvent } = req.body ?? {};
    const ihost = getIHostCred();
    const uiid = eWeLinkEvent.extra.uiid
    const device = buildEndpoint[uiid as keyof typeof buildEndpoint].buildEndpointUIID7017(eWeLinkEvent);
    const data: any = await thirdpartyDevice(device, ihost?.at ?? '', ihost?.url ?? '');
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
    const { params, deviceId } = req.body ?? {};
    const ihost = getIHostCred();
    const mapping = getMapping(deviceId);
    const serial_number = mapping?.ihost_serial as string;
    const state = buildEndpoint[mapping?.uiid as keyof typeof buildEndpoint]?.paramsToIHostState(params);
    const data: any = await updateThirdpartyDevice(state, serial_number, deviceId, ihost?.at ?? '', ihost?.url ?? '');
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
      // iHost 回调 → server 转发 eWeLink 云端 WS 下发控制指令
      ewelinkWs.sendUpdate(endpoint.third_serial_number, params).catch((err: Error) =>
        console.error('[ewelink ws] webhook sendUpdate err', err),
      );
      res.json({
        "event": {
          "header": {
            "name": "Response",
            "message_id": header.message_id,
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
      // 回调如果更新目标温度、模式切回手动
      if (params.manTargetTemp) {
        const ihost = getIHostCred();
        const state = buildEndpoint[uiid as keyof typeof buildEndpoint].paramsToIHostState({ workMode: '0' });
        await updateThirdpartyDevice(state, endpoint.serial_number, endpoint.third_serial_number, ihost?.at ?? '', ihost?.url ?? '');
      }
    }
  } catch (err) {
    next(err);
  }
})

// 返回所有映射 (判断是否同步)
thirdpartyRouter.post('/open-api/thirdparty-map', async (_req, res, next) => {
  try {
    const ihost = getIHostCred();
    // 本地映射表
    const allMap = getAllMapping();
    // iHost 当前设备列表
    const devices = await getDevices(ihost?.url ?? '', ihost?.at ?? '');
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
