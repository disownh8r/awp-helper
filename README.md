# AWP.GG Helper

Seamlessly execute Lua scripts in Roblox through WebSockets directly from Visual Studio Code.

---

## Installation & Usage

To ensure smooth execution, either run the script manually or place it in your **AutoExec** folder for automatic execution.

### Lua Script:
```lua
repeat task.wait() until game:IsLoaded()

while task.wait(1) do
    pcall(function()
        local ws = websocket.connect("ws://localhost:33882/")
        
        if not ws then
            print("Failed to establish WebSocket connection")
            return
        end

        print("WebSocket connection established")

        ws:Send("auth:" .. game.Players.LocalPlayer.Name)

        ws.OnMessage:Connect(function(msg)
            local func, err = loadstring(msg)
            if err then
                ws:Send("compile_err:" .. err)
                return
            end
            pcall(func)
        end)

        ws.OnClose:Connect(function()
            print("WebSocket connection closed")
        end)

        while ws do wait() end
    end)
end
```

---

## Keybind Execution (VS Code)
To execute your script every time the file is saved ( Using CTRL + S ), **ensure autosaving is turned off** in order prevent unintentional executions.

### Steps:
1. Open **VS Code Settings** (`Ctrl + ,` on Windows or `Cmd + ,` on Mac).
2. Search for **Auto Save** and disable it.
3. Now every time you save the file, it will be executed.

---

## Troubleshooting
If you encounter any issues, feel free to reach out via Discord: **h_8r**.

---

## Credits
- **monte** & **yafyz** (Synapse X Execute)

