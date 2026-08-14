import { useWsStore } from '@/store/wsStore'
import { useUserStore } from '@/store/userStore'
import { updateThirdpartyDevice } from '@/api/open-api/thirdparty'

let sse: EventSource | null = null
// SSE connect
export function connectControlSse(): EventSource {
  const wsStore = useWsStore()
  const userStore = useUserStore()
  if (sse) return sse
  sse = new EventSource('/open-api/events')
  sse.addEventListener('device-control', (e) => {
    try {
      const { deviceid, params } = JSON.parse((e as MessageEvent).data)
      if (!deviceid || !params) return
      wsStore.updateParams({
        action: 'update',
        apikey: userStore.userData?.user.apikey,
        deviceid,
        params,
        userAgent: 'app',
        sequence: Date.now(),
      })
      // 如果 iHost 修改目标温度 params 添加 workMode (0: 手动模式) ,通过 eWeLink 将状态同步到 iHost
      if (params.manTargetTemp !== null && params.ecoTargetTemp === null && params.autoTargetTemp === null) {
        const newParams = { workMode: '0' }
        updateThirdpartyDevice(newParams, deviceid, localStorage.getItem('iHostToken') as string, localStorage.getItem('iHost') as string)
      }
    } catch (err) {
      console.error('sse err', err)
    }
  })
  return sse
}

export function closeSse() {
  sse?.close();
  sse = null;
}