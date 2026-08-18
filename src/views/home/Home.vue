<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, computed } from "vue";
import NoTing from "@/components/NoTing.vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/userStore";
import { useFamilyStore } from "@/store/home/familyStore";
import { useThingStore } from "@/store/home/thingStore";
import { useWsStore } from "@/store/wsStore";
import Thing from "./components/Thing.vue";
import type { ThingListItem } from './types.ts';
import ThirdpartyModel from "./components/thirdparty/thirdpartyModel.vue";
import DeleteModel from "./components/thirdparty/deleteModel.vue";

import UnSupportDeviceModel from "./components/device/UnSupportDeviceModel.vue";
import { getThirdpartyDevice } from "@/api/open-api/thirdparty.ts";

const router = useRouter();
const userStore = useUserStore();
const familyStore = useFamilyStore();
const thingStore = useThingStore();
const wsStore = useWsStore();

const familyListData = computed(() => familyStore.familyListData);

const contentRef = ref<HTMLElement | null>(null);

const dialogVisible = ref<boolean>(false);
const deviceDialogVisible = ref<boolean>(false);
const thirdpartyDialogVisible = ref<boolean>(false);
const deleteDialogVisible = ref<boolean>(false);

const thingLoading = ref<boolean>(false);
const thirdpartyMap = ref<Array<{ device_id: string; ihost_serial: string; }> | []>([]);

// 获取指定 room 的 thing
const getTingByRoom = (familyId: string, roomId: string) => {
  const thingByFamily = thingStore.getThingsByFamilyId(familyId);
  return thingByFamily.filter((item) => item.itemData.family.roomid === roomId);
};

// 获取未分配的 thing
const getDeclareThings = (familyId: string) => {
  const thingByFamily = thingStore.getThingsByFamilyId(familyId);
  return thingByFamily.filter((item) => {
    const roomId = item.itemData.family.roomid;
    return !roomId;
  });
};

const logout = async () => {
  userStore.clearUserInfo();
  router.push("/login");
  wsStore.closeWs();
};

const currentThing = ref<ThingListItem | null>(null);

// uiid 加载 model
const supportUIID = ['4', '7017']
const currentDeviceModel = computed(() => {
  const uiid = String(currentThing.value?.itemData.extra?.uiid);
  if (!uiid || !supportUIID.includes(uiid)) return UnSupportDeviceModel;
  return defineAsyncComponent(() => import(`./components/device/uiid${uiid}/ThingModel.vue`));
});

const handleOpenThingModel = (thing: ThingListItem) => {
  currentThing.value = thing;
  deviceDialogVisible.value = true;
};

// 打开 iHost 凭证弹窗
const handleOpenThirdparty = (thing: ThingListItem) => {
  currentThing.value = thing;
  thirdpartyDialogVisible.value = true;
};

// 打开删除弹窗
const handleOpenDelete = (thing: ThingListItem) => {
  currentThing.value = thing;
  deleteDialogVisible.value = true;
};

const getDeviceMap = async () => {
  const res = await getThirdpartyDevice();
  const list = res.data?.device_list || [] ;
  thirdpartyMap.value = list
    .filter((d: { [key: string]: any }) => d.serial_number && d.third_serial_number)
    .map((d: { [key: string]: any }) => ({
      device_id: d.third_serial_number,
      ihost_serial: d.serial_number
    }));
  console.log(thirdpartyMap.value);
};

onMounted(async () => {
  thingLoading.value = true;
  try {
    await wsStore.wsConnect();
    await getDeviceMap();
    await familyStore.getFamilyList();
    if (familyListData.value?.familyList) {
      const promises = familyListData.value.familyList.map((family) =>
        thingStore.getTingListById(family.id),
      );
      await Promise.allSettled(promises);
    }
  } finally {
    thingLoading.value = false;
  }
});

</script>

<template>
  <div class="home-container" v-loading="thingLoading">
    <div class="anchor">
      <div class="text-center text-[24px] font-bold mt-[12px]">Demo</div>
      <div class="mt-[20px] mb-[20px] h-0 flex-1 overflow-auto">
        <el-anchor :container="contentRef">
          <el-anchor-link v-for="family in familyListData?.familyList" :key="family.id" :href="`#${family.id}`">
            {{ family.name }}
            <template #sub-link>
              <el-anchor-link v-if="getDeclareThings(family.id).length > 0"
                :href="`#${family.id}-unDeclare`">未分配</el-anchor-link>
              <el-anchor-link v-for="room in family.roomList" :key="room.id" :href="`#${room.id}`">
                {{ room.name }}
              </el-anchor-link>
            </template>
          </el-anchor-link>
        </el-anchor>
      </div>
      <el-button class="w-full" @click="dialogVisible = true">退出登录</el-button>
    </div>
    <div class="content" ref="contentRef">
      <div :id="family.id" class="room pt-[20px]" v-for="family in familyListData?.familyList" :key="family.id">
        <div class="text-[20px] font-bold">{{ family.name }}</div>
        <!-- 处理未分配情况 -->
        <div v-if="getDeclareThings(family.id).length > 0" :id="`${family.id}-unDeclare`" class="mt-[20px]">
          <div class="text-[20px]">未分配</div>
          <div class="flex gap-[24px] mt-[12px] flex-wrap">
            <Thing v-for="thing in getDeclareThings(family.id)" :key="thing.itemData.deviceid" :thing="thing"
              :thirdpart-map="thirdpartyMap" @click="handleOpenThingModel(thing)"
              @open-thirdparty="handleOpenThirdparty" @open-delete="handleOpenDelete" />
          </div>
        </div>

        <div :id="room.id" class="mt-[20px]" v-for="room in family.roomList">
          <div class="text-[20px]">{{ room.name }}</div>
          <div v-if="getTingByRoom(family.id, room.id).length > 0" class="flex gap-[24px] mt-[12px] flex-wrap">
            <Thing v-for="thing in getTingByRoom(family.id, room.id)" :key="thing.itemData.deviceid" :thing="thing"
              :thirdpart-map="thirdpartyMap" @click="handleOpenThingModel(thing)"
              @open-thirdparty="handleOpenThirdparty" @open-delete="handleOpenDelete" />
          </div>

          <NoTing v-else />
        </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" title="Tip" align-center width="400">
    <span>是否确认退出登录</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="logout"> 确认 </el-button>
      </div>
    </template>
  </el-dialog>
  <component :is="currentDeviceModel" v-model="deviceDialogVisible" :thing="currentThing"
    :thirdpart-map="thirdpartyMap" />
  <ThirdpartyModel v-model="thirdpartyDialogVisible" :thing="currentThing" @get-map="getDeviceMap" />
  <DeleteModel v-model="deleteDialogVisible" :thing="currentThing" @get-map="getDeviceMap" />
</template>

<style scoped lang="scss">
.home-container {
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: rgb(248, 250, 252);
  display: flex;
  overflow: hidden;

  .anchor {
    width: 240px;
    height: 100%;
    padding: 20px 0;
    background-color: #fff;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    min-width: 200px;
    height: 100%;
    padding: 20px;
    overflow: auto;
  }
}
</style>
