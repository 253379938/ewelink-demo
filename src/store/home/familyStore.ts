import { defineStore } from 'pinia'
import { ref } from 'vue'
import { appid } from '@/constants'
import type { FamilyData } from '@/views/home/types'

export const useFamilyStore = defineStore('family', () => {

  const familyListData = ref<FamilyData | null>(null);

  const getFamilyList = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      const data = await fetch("/api/v2/family", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-CK-Appid': appid,
        },
      });
      const res = await data.json();
      if (res.error === 0) {
        familyListData.value = res.data;
      } else {
        throw new Error(res.msg);
      }
    } catch {
      
    } finally {
    }
  };


  return {
    familyListData,
    getFamilyList,
  };
});