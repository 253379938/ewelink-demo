import { Router } from 'express'
import { deleteThirdpartyDevice, getAccessToken, getThirdpartyDevice, thirdpartyDevice, updateThirdpartyDevice } from '../services/ihost.ts'
import { buildEndpoint } from '../utils/buildEndpoint/index.ts'
import { getIHostCred, saveIHostCred } from '../db/index.ts'
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
    const device = buildEndpoint[eWeLinkEvent.productModel as keyof typeof buildEndpoint].buildEndpointUIID(eWeLinkEvent);
    const data = await thirdpartyDevice(device, ihost?.at ?? '', ihost?.url ?? '');
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
})

// 设备状态更新
thirdpartyRouter.post('/open-api/device', async (req, res, next) => {
  try {
    const { params, deviceId, name } = req.body ?? {};
    const ihost = getIHostCred();
    const { data: { device_list } } = await getThirdpartyDevice(ihost?.at as string, ihost?.url as string);
    const device = device_list.filter((d: { [key: string]: any }) => d.third_serial_number === deviceId);
    const serial_number = device[0].serial_number as string;
    if (name === 'DeviceStatesChangeReport') {
      const state = buildEndpoint[device[0].model as keyof typeof buildEndpoint]?.paramsToIHostState(params);
    const data = await updateThirdpartyDevice(state, serial_number, deviceId, ihost?.at ?? '', ihost?.url ?? '', name);
    res.json({ status: 'ok', data });
    }
    if (name === 'DeviceInformationUpdatedReport') {
      const state = buildEndpoint[device[0].model as keyof typeof buildEndpoint]?.paramsToIHostCapabilities(params);
    const data = await updateThirdpartyDevice(state, serial_number, deviceId, ihost?.at ?? '', ihost?.url ?? '', name);
    res.json({ status: 'ok', data });
    }
    
  } catch (err) {
    next(err);
  }
})

// ihost 网关推送的状态变更
thirdpartyRouter.post('/open-api/device/:deviceId', async (req, res, next) => {
  try {
    const { directive: { header, endpoint, payload } } = req.body ?? {};
    const ihost = getIHostCred();
    const { data: { device_list } } = await getThirdpartyDevice(ihost?.at as string, ihost?.url as string);
    const device = device_list.filter((d: { [key: string]: any }) => d.third_serial_number === endpoint.third_serial_number);
    let params ={};
    if (header.name === 'UpdateDeviceStates') {
      params = buildEndpoint[device[0].model as keyof typeof buildEndpoint].stateToParams(payload.state);
    }
    if (header.name === 'ConfigureDeviceCapabilities') {
      params = buildEndpoint[device[0].model as keyof typeof buildEndpoint].capabilitiesToParams(payload.capabilities);
    }
    // iHost 回调 → server 转发 eWeLink 云端 WS 下发控制指令
    const resp = await ewelinkWs.sendUpdate(endpoint.third_serial_number, params).catch((err: Error) =>
      console.error('[ewelink ws] webhook sendUpdate err', err),
    );
    if (resp.error === 0) {
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
                "serial_number": endpoint.serial_number,
                "third_serial_number": endpoint.third_serial_number
              }
            ]
          }
        }
      });
      if ('manTargetTemp' in params) {
        const ihost = getIHostCred();
        const state = buildEndpoint[device[0].model as keyof typeof buildEndpoint].paramsToIHostState({ workMode: '0' });
        await updateThirdpartyDevice(state, endpoint.serial_number, endpoint.third_serial_number, ihost?.at ?? '', ihost?.url ?? '', 'DeviceStatesChangeReport');
      }
    } else {
      res.json({
        "event": {
          "header": {
            "name": "ErrorResponse",
            "message_id": header.message_id,
            "version": "2"
          },
          "payload": {
            "endpoints": [
              {
                "serial_number": endpoint.serial_number,
                "third_serial_number": endpoint.third_serial_number
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

// 查询同步设备
thirdpartyRouter.get('/open-api/devices', async (_req, res, next) => {
  try {
    const ihost = getIHostCred();
    const { data: { device_list } } = await getThirdpartyDevice(ihost?.at as string, ihost?.url as string);
    res.json({ status: 'ok', data: { device_list } });
  } catch (err) {
    next(err);
  }
})

// 取消同步设备
thirdpartyRouter.delete('/open-api/device/:deviceId', async (req, res, next) => {
  try {
    const { deviceId } = req.params ?? {};
    const ihost = getIHostCred();
    const { data: { device_list } } = await getThirdpartyDevice(ihost?.at as string, ihost?.url as string);
    const device = device_list.filter((d: { [key: string]: any }) => d.third_serial_number === deviceId);
    
    const { data } = await deleteThirdpartyDevice(ihost?.at as string, ihost?.url as string, device[0].serial_number);
    res.json({ status: 'ok', data });
  } catch (err) {
    next(err);
  }
})