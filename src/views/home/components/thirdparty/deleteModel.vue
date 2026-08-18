<script setup lang="ts">
import { deleteThirdpartyDevice } from '@/api/open-api/thirdparty';
import type { ThingListItem } from '../../types';

const props = defineProps<{
    thing: ThingListItem | null;
}>();
const emit = defineEmits<{ (e: "get-map"): void }>();

const modelValue = defineModel<boolean>();

const handleConfirm = async() => {
     try {
        await deleteThirdpartyDevice(props.thing?.itemData.deviceid!)
    } catch {
    } finally {
         modelValue.value = false;
                emit('get-map');

    }
}

</script>

<template>
    <el-dialog v-model="modelValue" title="是否确认取消同步该设备" width="420" align-center>
        <template #footer>
            <el-button @click="modelValue = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
    </el-dialog>
</template>

<style scoped lang="scss"></style>
