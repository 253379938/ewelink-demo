<script setup lang="ts">
import { computed } from "vue";
import type { ThingListItem } from "../types";
import { getSwitchStatus } from "@/utils/getSwitchStatus";
import { Connection } from "@element-plus/icons-vue";

const props = defineProps<{
    thing: ThingListItem;
    thirdpartMap: Array<{ device_id: string; ihost_serial: string; }>;
}>();

const emit = defineEmits<{ (e: "open-thirdparty", thing: ThingListItem): void, (e: "open-delete", thing: ThingListItem): void }>();

const switchStatusText = computed(() => {
    const switches = props.thing.itemData?.params?.switches;
    if (!switches) {
        return "";
    }
    const status = getSwitchStatus(switches);
    return status.text;
});

const supportThirdparty = computed(
    () =>
        props.thing.itemData.extra &&
        String(props.thing.itemData.extra.uiid) === "7017",
);

const isSynced = computed(() =>
    props.thirdpartMap.some((m) => m.device_id === props.thing.itemData.deviceid)
);

const handleThirdparty = () => {
    emit("open-thirdparty", props.thing);
}

const handleDelete = () => {
    emit("open-delete", props.thing);
}
</script>

<template>
    <div class="p-4 border rounded bg-white w-[200px] h-[120px] cursor-pointer relative">
        <div class="font-bold">{{ thing.itemData.name }}</div>
        <div class="text-xs mt-[12px]" :class="thing.itemData.online ? 'text-green-500' : 'text-red-500'">
            {{ thing.itemData.online ? "在线" : "离线" }}
        </div>
        <div class="text-xs mt-[12px]" v-if="thing.itemData.online && thing.itemData.extra.uiid === '4'">
            {{ switchStatusText }}
        </div>
        <el-tooltip content="同步到 iHost" effect="light" v-if="!isSynced">
            <el-button v-if="supportThirdparty" class="absolute top-0 right-0" :icon="Connection" type="info" text
                circle @click.stop="handleThirdparty" />
        </el-tooltip>
        <div v-else class="absolute top-2 right-2 text-xs text-blue-500">
            <span @click.stop="handleDelete" class="text-[red]">取消同步</span>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
