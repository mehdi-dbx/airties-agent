import { AgentNode }  from './AgentNode'
import { LlmNode }    from './LlmNode'
import { ToolNode }   from './ToolNode'
import { GenieNode }  from './GenieNode'
import { DataNode }   from './DataNode'

export const nodeTypes = {
  agent: AgentNode,
  llm:   LlmNode,
  tool:  ToolNode,
  genie: GenieNode,
  data:  DataNode,
} as const
