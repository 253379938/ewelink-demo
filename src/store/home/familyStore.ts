import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FamilyData } from '@/views/home/types'
import request from '@/request/request'

export const useFamilyStore = defineStore('family', () => {

  const familyListData = ref<FamilyData | null>(null);

  const getFamilyList = async () => {
    try {
      const res = await request.get("/v2/family");
        familyListData.value = res.data;
    } catch {
    } 
  };

  return {
    familyListData,
    getFamilyList,
  };
});