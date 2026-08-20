<script setup lang="ts">
import type { ThingListItem } from '@/views/home/types';
import { Minus, Plus } from '@element-plus/icons-vue';
import { computed, ref } from 'vue';
import { useWsStore } from '@/store/wsStore';
import { useUserStore } from '@/store/userStore';
import { updateThirdpartyDevice } from '@/api/open-api/thirdparty';
import { debounce } from 'lodash-es'
import { ElMessage } from "element-plus";
import { ArrowRight } from '@element-plus/icons-vue';
import WeeklyModel from './components/weekly.vue';

const modelValue = defineModel<boolean>();
const props = defineProps<{
    thing: ThingListItem;
    thirdpartMap: Array<{ device_id: string; ihost_serial: string; uiid: string }>;
}>();
const wsStore = useWsStore();
const userStore = useUserStore();

const loading = ref<boolean>(false)
const weeklyVisabled = ref<boolean>(false);

// 设备是否已同步到 iHost
const isSynced = computed(() =>
    props.thirdpartMap.some((m) => m.device_id === props.thing.itemData.deviceid)
);
const targetTemperature = computed<number>({
    get: () => props.thing?.itemData.params.curTargetTemp,
    set: (value) => {
        if (props.thing) props.thing.itemData.params.curTargetTemp = value;
    },
});

const changeByStep = (type: 'add' | 'minus') => {
    if (type === 'add' && targetTemperature.value < 350) {
        targetTemperature.value += 5;
    }
    if (type === 'minus' && targetTemperature.value > 40) {
        targetTemperature.value -= 5;
    }
    debouncedSetTarget();
};

const modeOptions: Array<{ mode: string, text: string, targetText: string }> = [
    {
        mode: '1',
        text: '关闭(防霜冻)',
        targetText: 'ecoTargetTemp'
    },
    {
        mode: '0',
        text: '手动模式',
        targetText: 'manTargetTemp'
    },
    {
        mode: '2',
        text: '自动模式',
        targetText: 'autoTargetTemp'
    },
];

const currentMode = computed(() => props.thing?.itemData.params.workMode);
const setTargetpoint = async () => {
    const params = {
        manTargetTemp: targetTemperature.value,
    }
    try {
        const res = await wsStore.updateParams({
            action: 'update',
            apikey: userStore.userData?.user.apikey,
            deviceid: props.thing?.itemData?.deviceid,
            params: params,
            userAgent: 'app',
            sequence: Date.now(),
        })
        if (res.error !== 0) {
            ElMessage.error('控制设备失败');
            throw new Error('update params err')
        }
        const newParams = {
            ...params,
            workMode: '0',
            ecoTargetTemp: props.thing?.itemData.params.ecoTargetTemp,
            autoTargetTemp: props.thing?.itemData.params.autoTargetTemp
        }
        // 已同步上报 iHost
        if (isSynced.value) {
            await updateThirdpartyDevice(newParams, props.thing.itemData.deviceid)
        }
    } catch (err) {
        console.error(err);
    }
}
const debouncedSetTarget = debounce(setTargetpoint, 300);

const setMode = async (mode: string) => {
    const params = {
        workMode: mode
    }
    try {
        loading.value = true;
        const res = await wsStore.updateParams({
            action: 'update',
            apikey: userStore.userData?.user.apikey,
            deviceid: props.thing?.itemData?.deviceid,
            params: params,
            userAgent: 'app',
            sequence: Date.now(),
        })
        if (res.error !== 0) {
            ElMessage.error('控制设备失败');
            throw new Error('update params err')
        }
        // 已同步上报 iHost
        if (isSynced.value) {
            await updateThirdpartyDevice(params, props.thing.itemData.deviceid)
        }
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
}

const openWeekly = () => {
    weeklyVisabled.value = true
}

</script>

<template>
    <el-dialog v-model="modelValue" width="540" align-center>
        <template #title>
            <div class="text-center font-bold text-lg">{{ thing?.itemData.name }}</div>
        </template>
        <div v-if="props.thing?.itemData.online" v-loading="loading">
            <div class="trv-container flex flex-col">
                <div class="state h-[62px] mb-[56px] flex justify-around">
                    <div class="text-center">
                        <div class="font-[600] text-[24px]"> {{ props.thing?.itemData.params.workState === '0' ? '保温中' :
                            '加热中'
                            }}
                        </div>
                        <div class="font-[500] text-[16px]">当前状态</div>
                    </div>
                    <div class="text-center">
                        <div class="font-[600] text-[24px]"> {{ props.thing?.itemData.params.temperature / 10 }}℃
                        </div>
                        <div class="font-[500] text-[16px]">当前温度</div>
                    </div>
                </div>
                <div class="target flex justify-around items-center mb-[56px]">
                    <el-button :icon="Minus" circle size="large" @click="changeByStep('minus')" />
                    <div class="temperature">
                        <div class="font-[600] text-[24px]">{{ targetTemperature / 10 }}℃</div>
                        <div class="font-[500] text-[16px]">目标温度</div>
                    </div>
                    <el-button :icon="Plus" circle size="large" @click="changeByStep('add')" />
                </div>
                <div class="mode mb-[36px]">
                    <div class="font-[600] text-[16px]">模式</div>
                    <div class="flex justify-around pt-[20px] gap-[10px]">
                        <div v-for="mode in modeOptions" :key="mode.mode"
                            :class="currentMode === mode.mode ? 'active-mode' : 'item-mode'" @click=setMode(mode.mode)>
                            {{ mode.text }}
                        </div>
                    </div>
                </div>
                <div>
                    <div class="font-[600] text-[16px]">日程</div>
                    <div class="flex justify-around pt-[20px] gap-[10px]" @click="openWeekly">
                        <div class="weekly-item">
                            <div class="font-bold">日程设置</div>
                            <div class="flex h-[24px] items-center leading-[24px]">
                                <span class="text-[14px] mr-[8px]">仅在自动模式下生效</span>
                                <span class="h-[24px]"><el-icon :size="22"><ArrowRight /></el-icon></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="text-center">
            设备离线，请检查设备状态
        </div>
        <WeeklyModel v-model="weeklyVisabled" :thing="thing" />
    </el-dialog>
</template>

<style scoped lang="scss">
.item-mode {
    height: 100px;
    flex: 1;
    border-radius: 14px;
    background-color: rgb(204, 204, 204, .25);
    text-align: center;
    line-height: 100px;
    font-size: 16px;
    cursor: pointer;
}

.active-mode {
    height: 100px;
    flex: 1;
    border-radius: 14px;
    background-color: #1890ff;
    color: #fff;
    text-align: center;
    line-height: 100px;
    font-size: 16px;
    cursor: pointer;
}

.weekly-item{
    height: 66px;
    flex: 1;
    padding: 0 24px;
    border-radius: 14px;
    background-color: rgb(204, 204, 204, .25);
    text-align: center;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
