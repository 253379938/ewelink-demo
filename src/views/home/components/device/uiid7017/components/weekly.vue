<script setup lang="ts">
import type { ThingListItem } from '@/views/home/types';
import { Edit, Document, CirclePlus, Delete } from '@element-plus/icons-vue';
import { computed, ref, watch } from 'vue';
import { useWsStore } from '@/store/wsStore';
import { useUserStore } from '@/store/userStore';

const props = defineProps<{
    thing: ThingListItem;
}>();

const modelValue = defineModel<boolean>();

const wsStore = useWsStore();
const userStore = useUserStore();
const loading = ref<boolean>(false);
// 当前选中星期
const isDay = ref<string>('sun');

// 编辑状态
const isEdited = ref<boolean>(false);

// 当前日期的有效日程段列表 仅存储实际数据，不含补全项
interface ScheduleItem {
    time: number;
    temp: number;
}
// 草稿
const scheduleDraft = ref<Record<string, ScheduleItem[]>>({});
const weekDays = ['mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun'];

// 当前选中星期的草稿
const scheduleItems = computed(() => scheduleDraft.value[isDay.value] || []);

// 星期选项
const weekOptions = [
    { label: '周日', value: 'sun' },
    { label: '周一', value: 'mon' },
    { label: '周二', value: 'tues' },
    { label: '周三', value: 'wed' },
    { label: '周四', value: 'thur' },
    { label: '周五', value: 'fri' },
    { label: '周六', value: 'sat' },
];

//温度选项 4~35℃
const tempOptions = computed(() => {
    const options = [];
    for (let t = 4; t <= 35; t += 0.5) {
        options.push({ label: t.toFixed(1) + '℃', value: t });
    }
    return options;
});

// 将分钟数转换为 "HH:mm" 字符串
const formatTimeForPicker = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 将 "HH:mm" 字符串转化为分钟数
const parseTimeFromPicker = (str: string): number => {
    if (!str) return 0;
    const parts = str.split(':');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
};

// 字符串转为 { time, temp }
const parseDayData = (day: string): ScheduleItem[] => {
    const hex = props.thing?.itemData?.params?.[day] || '';
    if (!hex || hex.length !== 48) {
        return [];
    }
    const items: ScheduleItem[] = [];
    for (let i = 0; i < 6; i++) {
        const seg = hex.substr(i * 8, 8);
        const timeHex = seg.substr(0, 4);
        const tempHex = seg.substr(4, 4);
        const time = parseInt(timeHex, 16);
        const temp = parseInt(tempHex, 16) / 10;
        items.push({ time, temp });
    }
    // 去除末尾连续重复项，保留一个
    if (items.length === 0) return [];
    const last = items[items.length - 1];
    let cutIndex = items.length - 1;
    while (cutIndex > 0 &&
        items[cutIndex - 1].time === last.time &&
        items[cutIndex - 1].temp === last.temp) {
        cutIndex--;
    }
    return items.slice(0, cutIndex + 1);
};

const generateHex = (items: ScheduleItem[]): string => {
    // 先按时间升序排序
    const sorted = [...items].sort((a, b) => a.time - b.time);
    // 补全至6项，不足时复制最后一项
    const result: ScheduleItem[] = [];
    result.push(...sorted);
    if (result.length === 0) {
        for (let i = 0; i < 6; i++) {
            result.push({ time: 0, temp: 0 });
        }
    } else {
        const last = result[result.length - 1];
        while (result.length < 6) {
            result.push({ ...last });
        }
    }
    const segments = result.slice(0, 6).map(item => {
        const timeHex = Math.min(Math.max(item.time, 0), 1440)
            .toString(16)
            .padStart(4, '0');
        const tempRaw = Math.round(item.temp * 10);
        const tempHex = Math.min(Math.max(tempRaw, 0), 500)
            .toString(16)
            .padStart(4, '0');
        return timeHex + tempHex;
    });
    return segments.join('');
};

//  保存
const saveDay = async () => {
    const params: Record<string, string> = {};
    for (const day of weekDays) {
        params[day] = generateHex(scheduleDraft.value[day] || []);
    }
    loading.value = true;
    try {
        await wsStore.updateParams(
            {
                action: 'update',
                apikey: userStore.userData?.user.apikey,
                deviceid: props.thing?.itemData?.deviceid,
                params: params,
                userAgent: 'app',
                sequence: Date.now(),
            }
        )
    } catch { } finally {
        loading.value = false;
        isEdited.value = false;
    }
};

// 从 params 拿到草稿数据
const buildDraft = () => {
    const draft: Record<string, ScheduleItem[]> = {};
    for (const day of weekDays) {
        draft[day] = parseDayData(day);
    }
    scheduleDraft.value = draft;
};

// 弹窗打开时加载草稿；关闭后丢弃，下次打开重新从 params 加载
watch(modelValue, (open) => {
    if (open) buildDraft();
    isEdited.value = false;
    isDay.value = 'sun';
});

const toggleEdit = () => {
    isEdited.value = !isEdited.value;
};

const addInterval = () => {
    if (scheduleItems.value.length >= 6) return
    scheduleItems.value.push({ time: 0, temp: 4 });
    if (!isEdited.value) isEdited.value = true;
};

const removeInterval = (index: number) => {
    scheduleItems.value.splice(index, 1);
};

// 按时间升序排序当前天的草稿（时间选择器确认后触发）
const sortItems = () => {
    scheduleItems.value.sort((a, b) => a.time - b.time);
};

// 格式化显示
const formatTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 按钮配置
const buttonConfig = computed(() => ({
    type: isEdited.value ? 'primary' : 'info',
    icon: isEdited.value ? Document : Edit,
}));
</script>

<template>
    <el-dialog v-model="modelValue" width="540" align-center>
        <template #header>
            <div class="text-center font-bold text-lg">日程</div>
        </template>
        <div class="pl-[12px] pr-[12px]" v-loading="loading">
            <div class="oper mt-[24px] text-right">
                <el-button text :type="buttonConfig.type" :icon="buttonConfig.icon"
                    @click="isEdited ? saveDay() : toggleEdit()">
                    {{ isEdited ? '保存' : '编辑' }}
                </el-button>
            </div>

            <div class="weekly-option flex justify-between items-center mt-[18px]">
                <div class="day" :class="{ active: isDay === day.value }" v-for="day in weekOptions" :key="day.value"
                    @click="isDay = day.value">
                    {{ day.label }}
                </div>
            </div>

            <div class="mt-[28px] w-[100px]"
                :class="{ 'opacity-50 cursor-not-allowed': !isEdited, 'add-active': isEdited }">
                <div class="flex items-center" @click="isEdited && addInterval()">
                    <el-icon :size="20">
                        <CirclePlus />
                    </el-icon>
                    <div class="ml-3">增加区间</div>
                </div>
            </div>

            <div class="schedule mt-[28px] min-h-[270px]">
                <div class="item mt-[24px]" v-for="(item, index) in scheduleItems" :key="index">
                    <template v-if="!isEdited">
                        <div class="flex-1 flex justify-around items-center">
                            <span class="text-base">{{ formatTime(item.time) }}</span>
                            <span class="text-base">{{ item.temp.toFixed(1) }}℃</span>
                        </div>
                    </template>
                    <template v-else>
                        <div class="flex-1 flex items-center gap-4 px-4">
                            <el-time-picker :model-value="formatTimeForPicker(item.time)"
                                @update:model-value="(val: string) => { item.time = parseTimeFromPicker(val) }"
                                @change="sortItems" format="HH:mm" value-format="HH:mm" size="small"
                                style="width: 120px" :disabled="index === 0" placeholder="选择时间" />
                            <el-select v-model="item.temp" size="small" style="width: 100px; margin-left: 68px; margin-right: 48px;">
                                <el-option v-for="opt in tempOptions" :key="opt.value" :label="opt.label"
                                    :value="opt.value" />
                            </el-select>
                            <el-button v-if="index !== 0" type="danger" text :icon="Delete"
                                @click="removeInterval(index)" size="small" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<style scoped lang="scss">
.day {
    width: 50px;
    height: 50px;
    text-align: center;
    line-height: 50px;
    border-radius: 50%;
    border: #ccc solid 1px;
    cursor: pointer;
}

.active {
    background: #1890ff;
    color: #fff;
}

.item {
    width: 100%;
    min-height: 54px;
    display: flex;
    align-items: center;
    border-radius: 3px;
    background-color: rgb(244, 244, 244);
    padding: 0 12px;
}

.add-active {
    cursor: pointer;
}

.opacity-50 {
    opacity: 0.5;
}

.cursor-not-allowed {
    cursor: not-allowed;
}
</style>