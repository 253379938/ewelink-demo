import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appid } from '@/constants'
import type { ThingListItem,SwitchItem } from '@/views/home/types'

export const useThingStore = defineStore('thing', () => {
  const familyThingsMap = ref<Map<string, ThingListItem[]>>(new Map());
  const updateSwitches = ref<SwitchItem[]>([]);
  const getTingListById = async (familyId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token');

      const data = await fetch(`/api/v2/device/thing?familyid=${familyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CK-Appid': appid,
        },
      });
      const res = await data.json();
      if (res.error === 0) {
        familyThingsMap.value.set(familyId, res.data.thingList);
      } else {
        throw new Error(res.msg);
      }
    } catch  {
    }
  };

  const getThingsByFamilyId = (familyId: string): ThingListItem[] => {
    return familyThingsMap.value.get(familyId) || [];
  };

  const getThingById = (deviceid: string) => {
    const allDevices = Array.from(familyThingsMap.value.values()).flat();
    const currentThing = allDevices.find(item => item.itemData.deviceid === deviceid);

    return currentThing;
  }
  const setThingSwitch = (deviceid: string, switches?: SwitchItem[]) => {
    const currentThing = getThingById(deviceid);
    if (!currentThing) return;
    if(switches?.length === 0 && updateSwitches.value.length === 0) return;
    currentThing.itemData.params.switches = switches || updateSwitches.value;
  }
  const setThingOnline = (deviceid: string, online: boolean) => { 
    const currentThing = getThingById(deviceid);
    if (!currentThing) return;
    currentThing.itemData.online = online;
  }

  return {
    familyThingsMap,
    updateSwitches,
    getTingListById,
    getThingsByFamilyId,
    getThingById,
    setThingSwitch,
    setThingOnline,
  };
});