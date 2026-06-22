<script setup lang="ts">
import { computed } from 'vue';
import type { ThingListItem, SwitchItem } from '../types';
import { getSwitchStatus } from '@/utils/getSwitchStatus';
import { useWsStore } from '@/store/wsStore'
import { useUserStore } from '@/store/userStore'
import { useThingStore } from '@/store/home/thingStore'

const modelValue = defineModel<boolean>();
const wsStore = useWsStore();
const userStore = useUserStore();
const thingStore = useThingStore();

const props = defineProps<{
    thing: ThingListItem | null;
}>();
const deviceName = computed(() => props.thing?.itemData?.name || '');
const isOnline = computed(() => props.thing?.itemData?.online);
const switches = computed(() => props.thing?.itemData?.params?.switches);
const allSwitchStatus = computed(() => {
    if (switches.value) {
        const status = getSwitchStatus(switches.value);
        return status.isAllOn;
    }
});

const changeAll = (val: boolean) => {
    const params: { switches: SwitchItem[] } = {
        switches: switches.value?.map((item) => ({
            outlet: item.outlet,
            switch: val ? 'on' : 'off',
        })) ?? [],
    };
    if (!wsStore.wsInstance) {
        throw new Error('wsInstance is null');
    };
    thingStore.updateSwitches = params.switches;
    wsStore.wsInstance.send(JSON.stringify({
        action: 'update',
        apikey: userStore.userData?.user.apikey,
        deviceid: props.thing?.itemData?.deviceid,
        params: params,
        userAgent: 'app',
        sequence: Date.now(),
    }));
}
const changeSwitch = (outlet: number, val: boolean) => {
    const params: { switches: SwitchItem[] } = {
        switches: switches.value?.map((item) => {
            if (item.outlet === outlet) {
                return {
                    outlet: item.outlet,
                    switch: val ? 'on' : 'off',
                };
            }
            return item;
        }) ?? [],
    };
    thingStore.updateSwitches = params.switches;
    if (!wsStore.wsInstance) {
        throw new Error('wsInstance is null');
    };
    wsStore.wsInstance.send(JSON.stringify({
        action: 'update',
        apikey: userStore.userData?.user.apikey,
        deviceid: props.thing?.itemData?.deviceid,
        params: params,
        userAgent: 'app',
        sequence: Date.now(),
    }));
}

</script>

<template>
    <el-dialog v-model="modelValue" :title="deviceName" width="420" align-center>
        <template v-if="isOnline">
            <div class="p-[8px]">
                <el-switch :model-value="allSwitchStatus" inline-prompt active-text="全开" inactive-text="全关" size="large"
                    @change="changeAll" />
            </div>
            <div class="flex flex-wrap">
                <div class="w-[50%] p-[8px] flex items-center justify-between" v-for="item in switches"
                    :key="item.outlet">
                    <el-switch :model-value="item.switch === 'on'" size="large"
                        @change="changeSwitch(item.outlet, $event)" />
                    <span class="font-bold">通道{{ item.outlet + 1 }}</span>
                </div>
            </div>
        </template>
        <div v-else class="text-center">
            设备离线，请检查设备状态
        </div>
    </el-dialog>
</template>

<style scoped lang="scss"></style>
