import fs from 'fs';
import TOML from '@iarna/toml';
import prompts from 'prompts';
import { logger } from './logger';
import type { Config } from './index';
import type { JsonMap } from '@iarna/toml';

interface TomlConfig {
    host?: string;
    port?: number;
    prefix?: string;
    root?: string[];
    admin?: string[];
    plugins?: string[];
}

export class ConfigManager {
    private config: Config;
    private configPath: string;

    constructor(configPath: string = 'xinc.config.toml') {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    init(configPath: string): void {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    private loadConfig(): Config {
        try {
            // 检查配置文件是否存在
            if (!fs.existsSync(this.configPath)) {
                // 创建默认配置
                const defaultConfig: Config = {
                    host: '',
                    port: 0,
                    prefix: '#',
                    root: [],
                    admin: [],
                    plugins: ['cmd']
                };
                
                // 保存默认配置
                this.saveConfigToFile(defaultConfig);
                return defaultConfig;
            }

            const fileContent = fs.readFileSync(this.configPath, 'utf-8');
            
            // 处理空文件的情况
            if (!fileContent.trim()) {
                const defaultConfig: Config = {
                    host: '',
                    port: 0,
                    prefix: '#',
                    root: [],
                    admin: [],
                    plugins: ['cmd']
                };
                
                this.saveConfigToFile(defaultConfig);
                return defaultConfig;
            }
            
            try {
                const data = TOML.parse(fileContent) as any as TomlConfig;
                
                // 确保所有必要字段都存在，使用默认值填充缺失字段
                return {
                    host: data.host || '',
                    port: typeof data.port === 'number' ? data.port : 0,
                    prefix: data.prefix || '#',
                    root: Array.isArray(data.root) ? data.root : [],
                    admin: Array.isArray(data.admin) ? data.admin : [],
                    plugins: Array.isArray(data.plugins) ? data.plugins : ['cmd']
                };
            } catch (parseError) {
                logger.error(`Failed to parse config: ${parseError}`);
                
                // 如果解析失败，创建一个新的默认配置
                const defaultConfig: Config = {
                    host: '',
                    port: 0,
                    prefix: '#',
                    root: [],
                    admin: [],
                    plugins: ['cmd']
                };
                
                this.saveConfigToFile(defaultConfig);
                return defaultConfig;
            }
        } catch (error) {
            logger.error(`Failed to load config: ${error}`);
            
            // 如果加载失败，返回默认配置
            return {
                host: '',
                port: 0,
                prefix: '#',
                root: [],
                admin: [],
                plugins: ['cmd']
            };
        }
    }

    async validateAndPrompt(): Promise<void> {
        let configChanged = false;
        
        // 检查并提示设置主机地址
        if (!this.config.host) {
            const response = await prompts({
                type: 'text',
                name: 'host',
                message: '请输入主机地址 (例如: 127.0.0.1):',
                initial: '127.0.0.1'
            });
            
            if (!response.host) {
                throw new Error('主机地址不能为空');
            }
            
            this.config.host = response.host;
            configChanged = true;
        }

        // 检查并提示设置端口
        if (!this.config.port) {
            const response = await prompts({
                type: 'number',
                name: 'port',
                message: '请输入端口号 (例如: 4001):',
                initial: 4001,
                validate: value => value > 0 && value < 65536 ? true : '端口号必须在 1-65535 之间'
            });
            
            if (!response.port) {
                throw new Error('端口号不能为空');
            }
            
            this.config.port = Number(response.port);
            configChanged = true;
        }

        // 检查前缀，如果为空则设置默认值
        if (this.config.prefix === undefined || this.config.prefix === null) {
            this.config.prefix = '/';
            configChanged = true;
        }

        // 检查并提示设置主人QQ号
        if (!this.config.root || this.config.root.length === 0) {
            const response = await prompts({
                type: 'text',
                name: 'root',
                message: '请输入主人QQ号:',
                validate: value => value.trim() !== '' ? true : 'QQ号不能为空'
            });
            
            if (!response.root) {
                throw new Error('主人QQ号不能为空');
            }
            
            this.config.root = [response.root];
            configChanged = true;
        }

        // 如果配置有变更，保存配置
        if (configChanged) {
            this.saveConfig();
            logger.info('配置已更新');
        }
    }

    private saveConfigToFile(config: Config): void {
        try {
            // 手动构建 TOML 字符串，确保格式正确
            const tomlString = [
                `host = "${config.host}"`,
                `port = ${config.port}`,
                `prefix = "${config.prefix}"`,
                `root = ${JSON.stringify(config.root)}`,
                `admin = ${JSON.stringify(config.admin)}`,
                `plugins = ${JSON.stringify(config.plugins)}`
            ].join('\n');
            
            fs.writeFileSync(this.configPath, tomlString, 'utf-8');
        } catch (error) {
            logger.error(`Failed to save config file: ${error}`);
        }
    }

    public saveConfig(): void {
        try {
            this.validateConfig(this.config);
            this.saveConfigToFile(this.config);
            logger.info('配置已保存');
        } catch (error) {
            logger.error(`保存配置失败: ${error}`);
        }
    }

    public getConfig(): Config {
        return this.config;
    }

    validateConfig(config: Config): void {
        // 检查必要字段
        if (config.host === undefined) throw new Error('配置中缺少 host 字段');
        if (config.port === undefined) throw new Error('配置中缺少 port 字段');
        if (!Array.isArray(config.root)) throw new Error('root 必须是数组');
        if (!Array.isArray(config.admin)) throw new Error('admin 必须是数组');
        if (!Array.isArray(config.plugins)) throw new Error('plugins 必须是数组');
        
        // 验证端口号
        if (config.port !== 0 && (typeof config.port !== 'number' || isNaN(config.port))) {
            throw new Error('port 必须是有效的数字');
        }
        if (config.port !== 0 && (config.port < 1 || config.port > 65535)) {
            throw new Error('port 必须在 1-65535 之间');
        }
    }

    /**
     * 更新插件列表
     * @param action 'add' | 'remove' 添加或移除插件
     * @param pluginName 插件名称
     */
    public updatePlugins(action: 'add' | 'remove', pluginName: string): void {
        try {
            if (action === 'add') {
                if (!this.config.plugins.includes(pluginName)) {
                    this.config.plugins.push(pluginName);
                }
            } else {
                this.config.plugins = this.config.plugins.filter(name => name !== pluginName);
            }
            this.saveConfig();
            logger.info(`插件 ${pluginName} ${action === 'add' ? '已添加到' : '已从'}配置中移除`);
        } catch (error) {
            logger.error(`更新插件配置失败: ${error}`);
        }
    }
}

export const configManager = new ConfigManager();
export default ConfigManager;