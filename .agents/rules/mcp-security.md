---
trigger: always_on
---

# MCP 設定檔安全規則

`.cursor/mcp.json` 包含資料庫密碼等敏感資訊，**絕不可 commit 至 git**。

## 必須遵守

1. 任何專案的 `.gitignore` 都必須包含 `.cursor/mcp.json`
2. 建立新專案或初始化 MCP 時，優先確認 `.gitignore` 已排除此檔案
3. 不可在程式碼、commit 訊息、文件中出現 `mcp.json` 內的密碼
4. Code review 時若發現 `mcp.json` 被追蹤，應立即移除並通知作者
