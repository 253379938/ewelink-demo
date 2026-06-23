<script setup lang="ts">
import { User, Lock, Location } from '@element-plus/icons-vue';
import {  reactive } from 'vue';
import { regionMapMerge, appSecret, type RegionInfo } from "@/constants"
import crypto from 'crypto-js'
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore'
import request from '@/request/request'
import { ElMessage } from 'element-plus';

const regionLabel = reactive<RegionInfo[]>(regionMapMerge);
const accountForm = reactive<{ countryCode: string; phoneNumber: string; password: string }>({
    countryCode: '',
    phoneNumber: '',
    password: '',
});

const router = useRouter();
const userStore = useUserStore();

const login = async () => {
    const formatAccount = {
        countryCode: accountForm.countryCode,
        phoneNumber: `${accountForm.countryCode}${accountForm.phoneNumber}`,
        password: accountForm.password,
    };
    const hashSecret = crypto.HmacSHA256(JSON.stringify(formatAccount), appSecret);
    const secretBase64 = hashSecret.toString(crypto.enc.Base64);
    try {
        const res = await request.post('/v2/user/login', formatAccount, {
            headers: {
                'Authorization': `Sign ${secretBase64}`,
                'Content-Type': 'application/json'
            }
        });
        userStore.setUserInfo(res.data);
        router.push('/home');
    } catch (err) {
    }
}
</script>

<template>
    <div class="login-container">
        <div class="login-box w-[396px]">
            <div class="text-[28px] font-bold text-center">账号登录</div>
            <el-form class="mt-[20px]" :model="accountForm">
                <el-form-item>
                    <el-select placeholder="请选择国家和地区" v-model="accountForm.countryCode" size="large">
                        <template #prefix>
                            <el-icon>
                                <Location />
                            </el-icon>
                        </template>
                        <template #label="{ label, value }">
                            <span class="float-left">{{ value }}</span>
                            <span class="float-right">{{ label }}</span>
                        </template>
                        <el-option v-for="item in regionLabel" :key="item.code" :label="item.region" :value="item.code">
                            <span class="float-left">{{ item.code }}</span>
                            <span class="float-right">{{ item.region }}</span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-input v-model="accountForm.phoneNumber" size="large" placeholder="请输入账号手机或邮箱" :prefix-icon="User" />
                </el-form-item>
                <el-form-item>
                    <el-input v-model="accountForm.password" size="large" placeholder="请输入密码" type="password"
                        show-password :prefix-icon="Lock" />
                </el-form-item>
            </el-form>
            <el-button size="large" type="primary" class="w-full mt-[20px]" @click="login">登录</el-button>
        </div>
    </div>
</template>
<style scoped lang="scss">
.login-container {
    width: 100%;
    height: 100%;
    background: url('@/assets/login_bac.png');
    background-size: cover;
    background-position: center;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>