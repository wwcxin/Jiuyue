import { definePlugin } from '../../src/core/plugin'

// 退休类型定义
type RetirementType = 'male' | 'female_worker' | 'female_cadre'
type RetirementInfo = {
    retirementAge: string
    retirementTime: string
    delayMonths: string
}

// 基础配置
const CONFIG = {
    COMMAND: '#退休计算',
    RETIREMENT_TYPES: {
        '男': 'male' as const,
        '女职工': 'female_worker' as const,
        '女干部': 'female_cadre' as const,
    },
    BASE_AGES: {
        male: 60,
        female_worker: 50,
        female_cadre: 55,
    },
    DELAY_RULES: {
        male: {
            startYear: 1965,
            endYear: 1976,
            monthStep: 4,
            maxDelay: 36,
        },
        female_worker: {
            startYear: 1975,
            endYear: 1984,
            monthStep: 2,
            maxDelay: 60,
        },
        female_cadre: {
            startYear: 1970,
            endYear: 1981,
            monthStep: 4,
            maxDelay: 36,
        },
    },
} as const

export default definePlugin({
    name: '退休计算',
    version: '1.0.0',
    setup(ctx) {
        ctx.handle('message', async (e) => {
            if (e.raw_message.startsWith(CONFIG.COMMAND)) {
                const [year = '', month = '', type = ''] = e.raw_message
                    .replace(CONFIG.COMMAND, '')
                    .trim()
                    .split(' ')
                    .map((v) => v.trim())
                    .filter(Boolean)

                const validTypes = Object.keys(CONFIG.RETIREMENT_TYPES)
                if (year.length !== 4 || +month > 12 || +month < 1 || !validTypes.includes(type)) {
                    await ctx.respond(e, [
                        `〓 退休年龄计算器使用说明 〓\n` +
                        `命令格式：${CONFIG.COMMAND} <年份> <月份> <类型>\n` +
                        `退休类型：\n` +
                        `- 男\n` +
                        `- 女职工（原女50）\n` +
                        `- 女干部（原女55）\n` +    
                        `使用示例：\n` +
                        `${CONFIG.COMMAND} 1990 12 男\n` +
                        `${CONFIG.COMMAND} 2000 5 女干部\n` +
                        `${CONFIG.COMMAND} 2004 8 女职工\n`
                ])
                    return
                }

                const retirementType = CONFIG.RETIREMENT_TYPES[type as keyof typeof CONFIG.RETIREMENT_TYPES]
                const data = calculateRetirement(+year, +month, retirementType)

                await ctx.respond(e, [
                    `〓 法定退休年龄计算结果 〓\n` +
                    `出生年月：${year}年${month}月\n` +
                    `退休类型：${type}\n` +
                    `退休年龄：${data.retirementAge}\n` +
                    `退休时间：${data.retirementTime}\n` +
                    `延迟月数：${data.delayMonths}\n`
                ])
            }
        })
    },
})

function calculateRetirement(yearOfBirth: number, monthOfBirth: number, type: RetirementType): RetirementInfo {
    // 计算月份差
    const monthDiff = (fromYear: number, fromMonth: number, toYear: number, toMonth: number): number => {
        return (toYear - fromYear) * 12 + toMonth - fromMonth
    }

    // 添加月份
    const addMonths = (date: Date, months: number): Date => {
        const newDate = new Date(date)
        newDate.setMonth(newDate.getMonth() + months)
        return newDate
    }

    // 格式化年龄
    const formatAge = (baseAge: number, extraYears: number, extraMonths: number): string => {
        return `${baseAge + extraYears}岁${extraMonths > 0 ? `${extraMonths}个月` : ''}`
    }

    const rule = CONFIG.DELAY_RULES[type]
    const baseAge = CONFIG.BASE_AGES[type]
    let retirementAge: string
    let delayMonths: number

    if (yearOfBirth < rule.startYear) {
        retirementAge = `${baseAge}岁`
        delayMonths = 0
    } else if (yearOfBirth > rule.endYear) {
        const extraYears = Math.floor(rule.maxDelay / 12)
        retirementAge = `${baseAge + extraYears}岁`
        delayMonths = rule.maxDelay
    } else {
        const diff = Math.ceil(monthDiff(rule.startYear, 1, yearOfBirth, monthOfBirth) / rule.monthStep)
        const extraYears = Math.floor(diff / 12)
        const extraMonths = diff % 12
        retirementAge = formatAge(baseAge, extraYears, extraMonths)
        delayMonths = diff
    }

    const retirementDate = addMonths(new Date(yearOfBirth, monthOfBirth - 1), baseAge * 12 + delayMonths)
    const retirementTime = `${retirementDate.getFullYear()}年${retirementDate.getMonth() + 1}月`

    return {
        retirementAge,
        retirementTime,
        delayMonths: `${delayMonths}个月`,
    }
}
