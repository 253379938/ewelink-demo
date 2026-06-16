<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { appid } from '@/constants';
import { ElMessage } from 'element-plus';
import type { FamilyData, ThingListData } from './types';
import NoTing from "@/components/NoTing.vue"

const familyListData = ref<FamilyData>();
const tingListData = ref<ThingListData>();

const contentRef = ref<HTMLElement | null>(null);

const getFamilyList = async () => {
    const data = await fetch("/api/v2/family", {
        method: 'Get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-CK-Appid': appid,
        },
    })
    const res = await data.json();
    if (res.error === 0) {
        familyListData.value = res.data;
    } else {
        ElMessage({
            type: 'error',
            message: res.msg,
        })
    }
}

const getTingList = async () => {
    const data = await fetch("/api/v2/device/thing", {
        method: 'Get',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'X-CK-Appid': appid,
        },
    })
    const res = await data.json();
    if (res.error === 0) {
        tingListData.value = res.data;
    } else {
        ElMessage({
            type: 'error',
            message: res.msg,
        })
    }
}

// function roomTingMapFn() {
//     const familyMap = new Map();
//     tingListData.value?.thingList.forEach((ting) => {

//         const familyid = ting.itemData.family.familyid;
//         if (!familyMap.get(familyid)) {
//             const family = new Map();
//             familyMap.set(familyid,family)
//         }
//         const family = familyMap.get(familyid);

//         const roomid = ting.itemData.family.roomid;
//         if (roomid) {
//             const tings = family.get(roomid);
//             if (tings) {
//                 tings.add(ting)
//             } else {
//                 const tings = new Set();
//                 tings.add(ting)
//                 family.set(roomid,tings)
//             }
//         } else {
//             console.log(ting)
//             if (!family.get('unDeclare')) {
//                 const tings = new Set();
//                 tings.add(ting)
//                 family.set('unDeclare',tings)
//             } else {
//                 const tings = family.get(roomid);
//                 tings.add(ting)
//             }
            
//         }
//     })    
//     console.log(familyMap)
//     return familyMap;
// }

onMounted(async() => {
    await getTingList();
    await getFamilyList();
    // roomTingMapFn();
})
</script>

<template>
    <div class="home-container">
        <div class="anchor">
            <div class="text-center text-[24px] font-bold mt-[12px]">Demo</div>
            <div class="mt-[20px] min-h-[300px]">
                <el-anchor :container="contentRef">
                    <el-anchor-link v-for="family in familyListData?.familyList" :key="family.id"
                        :href="`#${family.id}`">
                        {{ family.name }}
                        <template #sub-link>
                            <el-anchor-link v-for="room in family.roomList" :key="room.id" :href="`#${room.id}`">
                                {{ room.name }}
                            </el-anchor-link>
                        </template>
                    </el-anchor-link>
                </el-anchor>
            </div>
        </div>
        <div class="content pl-[22px] pr-[22px]" ref="contentRef">
            <div :id="family.id" class="room pt-[22px]" v-for="family in familyListData?.familyList">
                <div class="text-[24px] font-bold">{{ family.name }}</div>
                <div :id="room.id" class="mt-[20px]" v-for="room in family.roomList">
                    <div class="text-[20px] ">{{ room.name }}</div>
                    <NoTing />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.home-container {
    width: 100%;
    height: 100vh;
    display: flex;
    background-color: rgb(248, 250, 252);
    display: flex;

    .anchor {
        width: 240px;
        margin: 20px 0;
        background-color: #fff;
        overflow: auto;
    }

    .content {
        flex: 1;
        min-width: 200px;
        overflow: auto;
    }
}
</style>