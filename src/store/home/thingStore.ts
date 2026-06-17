import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appid } from '@/constants'
import type { ThingListItem } from '@/views/home/types'

export const useThingStore = defineStore('thing', () => {
  const familyThingsMap = ref<Map<string, ThingListItem[]>>(new Map());

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

  return {
    familyThingsMap,
    getTingListById,
    getThingsByFamilyId,
  };
});