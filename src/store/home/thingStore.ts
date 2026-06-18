import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThingListItem,SwitchItem } from '@/views/home/types'
import request from '@/request/request'

export const useThingStore = defineStore('thing', () => {
  const familyThingsMap = ref<Map<string, ThingListItem[]>>(new Map());
  const updateSwitches = ref<SwitchItem[]>([]);
  const getTingListById = async (familyId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token');

      const res = await request.get(`/v2/device/thing?familyid=${familyId}`);
        familyThingsMap.value.set(familyId, res.data.thingList);
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