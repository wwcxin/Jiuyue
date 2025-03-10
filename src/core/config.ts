import fs from 'fs';
import TOML from '@iarna/toml';
import prompts from 'prompts';
import { logger } from './';
import type { Config } from './';
import type { JsonMap } from '@iarna/toml';

interface TomlConfig extends JsonMap {
    host: string;
    port: number; // 改为 number 类型
    prefix: string;
    root: string[];
    admin: string[];
    plugins: string[];
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
            const fileContent = fs.readFileSync(this.configPath, 'utf-8');
            const data = TOML.parse(fileContent) as TomlConfig;
            return {
                host: data.host,
                port: Number(data.port), // 确保转换为数字
                prefix: data.prefix,
                root: data.root,
                admin: data.admin,
                plugins: data.plugins
            };
        } catch (error) {
            logger.error(`Failed to load config: ${error}`);
            process.exit(1);
        }
    }

    async validateAndPrompt(): Promise<void> {
        if (!this.config.host) {
            const response = await prompts({
                type: 'text',
                name: 'host',
                message: 'Please enter the host address:'
            });
            if (!response.host) {
                throw new Error('Host cannot be empty');
            }
            this.config.host = response.host;
        }

        if (!this.config.port) {
            const response = await prompts({
                type: 'text',
                name: 'port',
                message: 'Please enter the port number:'
            });
            if (!response.port) {
                throw new Error('Port cannot be empty');
            }
            this.config.port = Number(response.port); // 转换为数字
        }

        if (!this.config.root || this.config.root.length === 0) {
            const response = await prompts({
                type: 'text',
                name: 'root',
                message: 'Please enter the root user ID:'
            });
            if (!response.root) {
                throw new Error('Root user ID cannot be empty');
            }
            this.config.root = [response.root];
        }

        this.saveConfig();
    }

    public saveConfig(): void {
        try {
            this.validateConfig(this.config);
            const tomlData: TomlConfig = {
                host: this.config.host,
                port: Number(this.config.port), // 确保是数字类型
                prefix: this.config.prefix,
                root: this.config.root,
                admin: this.config.admin || [],
                plugins: this.config.plugins || []
            };
            
            // 手动构建 TOML 字符串，确保 port 被正确格式化
            const tomlString = [
                `host = "${tomlData.host}"`,
                `port = ${tomlData.port}`, // 直接输出数字，不带引号
                `prefix = "${tomlData.prefix}"`,
                `root = ${JSON.stringify(tomlData.root)}`,
                `admin = ${JSON.stringify(tomlData.admin)}`,
                `plugins = ${JSON.stringify(tomlData.plugins)}`
            ].join('\n');
            
            fs.writeFileSync(this.configPath, tomlString, 'utf-8');
            logger.info('Config saved successfully');
        } catch (error) {
            logger.error(`Failed to save config: ${error}`);
        }
    }

    private generateTomlString(): string {
        const lines: string[] = [];
        for (const [key, value] of Object.entries(this.config)) {
            if (Array.isArray(value)) {
                lines.push(`${key} = [${value.map(v => `"${v}"`).join(', ')}]`);
            } else {
                lines.push(`${key} = "${value}"`);
            }
        }
        return lines.join('\n');
    }

    public getConfig(): Config {
        return this.config;
    }

    validateConfig(config: Config): void {
        if (!config.host) throw new Error('Missing host in config');
        if (!config.port) throw new Error('Missing port in config');
        if (!Array.isArray(config.root)) throw new Error('Root must be an array');
        if (!Array.isArray(config.admin)) throw new Error('Admin must be an array');
        if (!Array.isArray(config.plugins)) throw new Error('Plugins must be an array');
        if (typeof config.port !== 'number' || isNaN(config.port)) {
            throw new Error('Port must be a valid number');
        }
        if (config.port < 1 || config.port > 65535) {
            throw new Error('Port must be between 1 and 65535');
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
            logger.info(`Plugin ${pluginName} ${action === 'add' ? 'added to' : 'removed from'} config`);
        } catch (error) {
            logger.error(`Failed to update plugins in config: ${error}`);
        }
    }
}

export const configManager = new ConfigManager();
export default ConfigManager;