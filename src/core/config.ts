import fs from 'fs'
import toml from 'toml'
import prompts from 'prompts'
import { logger } from './'
import type { Config } from './'

export class ConfigManager {
  private config: Config
  private configPath: string

  constructor(configPath: string = 'xinc.config.toml') {
    this.configPath = configPath
    this.config = this.loadConfig()
  }

  init(configPath: string): void {
    this.configPath = configPath
    this.config = this.loadConfig()
  }

  private loadConfig(): Config {
    try {
      const fileContent = fs.readFileSync(this.configPath, 'utf-8')
      return toml.parse(fileContent) as Config
    } catch (error) {
      logger.error(`Failed to load config: ${error}`)
      process.exit(1)
    }
  }

  async validateAndPrompt(): Promise<void> {
    if (!this.config.host) {
      const response = await prompts({
        type: 'text',
        name: 'host',
        message: 'Please enter the host address:'
      })
      this.config.host = response.host
    }

    if (!this.config.port) {
      const response = await prompts({
        type: 'text',
        name: 'port',
        message: 'Please enter the port number:'
      })
      this.config.port = response.port
    }

    if (!this.config.root || this.config.root.length === 0) {
      const response = await prompts({
        type: 'text',
        name: 'root',
        message: 'Please enter the root user ID:'
      })
      this.config.root = [response.root]
    }

    this.saveConfig()
  }

  public saveConfig(): void {
    try {
      const configString = this.generateTomlString()
      fs.writeFileSync(this.configPath, configString, 'utf-8')
      logger.info('Config saved successfully')
    } catch (error) {
      logger.error(`Failed to save config: ${error}`)
    }
  }

  private generateTomlString(): string {
    const lines: string[] = []
    for (const [key, value] of Object.entries(this.config)) {
      if (Array.isArray(value)) {
        lines.push(`${key} = [${value.map(v => `"${v}"`).join(', ')}]`)
      } else {
        lines.push(`${key} = "${value}"`)
      }
    }
    return lines.join('\n')
  }

  getConfig(): Config {
    return this.config
  }

  validateConfig(config: Config): void {
    if (!config.host) throw new Error('Missing host in config')
    if (!config.port) throw new Error('Missing port in config')
    if (!Array.isArray(config.root)) throw new Error('Root must be an array')
    if (!Array.isArray(config.admin)) throw new Error('Admin must be an array')
    if (!Array.isArray(config.plugins)) throw new Error('Plugins must be an array')
  }
}

export const configManager = new ConfigManager()
export default ConfigManager 