import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FamilyData } from '@/views/home/types'
import { getFamilys } from '@/api/ewelink-api/api';

export const useFamilyStore = defineStore('family', () => {

  const familyListData = ref<FamilyData | null>(null);

  const getFamilyList = async () => {
    try {
      const res = await getFamilys();
        familyListData.value = res.data;
    } catch {
    } 
  };

  return {
    familyListData,
    getFamilyList,
  };
});