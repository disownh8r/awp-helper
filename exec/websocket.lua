repeat task.wait() until game:IsLoaded()

while task.wait(1) do 
    pcall(function()
        local ws = websocket.connect("ws://localhost:33882/")
        
        if not ws then
            print("Failed to establish WebSocket Connection")
            return
        end

        print("WebSocket Connection Established")

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
            print("WebSocket Connection Closed")
        end)

        while ws do wait() end
    end)
end
