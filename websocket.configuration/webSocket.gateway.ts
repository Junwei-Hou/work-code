import { Injectable, Headers, Request, Res } from '@nestjs/common';
import { WebSocketServer } from 'ws';
import { OpenAIService } from '../openAI/openAI.service';
// import { Server, Socket } from 'socket.io';
@Injectable()
export class MyWebSocketGateway { 
  // private server: WebSocketServer;
  private server: WebSocketServer;

  constructor(
    private readonly openAIService: OpenAIService,
    // private readonly Request: any,

  ) {
    this.server = new WebSocketServer({ port: 9002 });

  }
  // constructor(private testWebsocketService: TestWebsocketService) {
  //   this.server = new WebSocketServer({ port: 9030 });
  // }
  start(): void {
    // user has connected will into userIdGroup
    let userIdGroup = []

    // user has connected by websocket
    this.server.on('connection', async (ws, param) => {
      console.log('init websocket')
      const url = new URL(param.url, "http://example.com")
      const searchParams = new URLSearchParams(url.search);
      const tokenValue = searchParams.get("token");
      const overtime = 10000 // 10s
      
      
      // The other user has logged in this account
      let userId = await this.openAIService.getUserIdByToken(tokenValue)
      console.log('-------userId', userId)
      if (userId === null ){
        ws.send('the user does not exist');
        return 
      }
      if (userIdGroup.includes(userId)) {
        ws.send('The other user has logged in this account')
      } else {
        userIdGroup.push(userId)
      }

 


      //receive message by websocket
      ws.on('message', message => {
        
 
        
        // if message if empty, return
        if (this.isEmptyObject(JSON.parse(message)) === true) {
          return
        }

        this.generateChatMessage(ws, message);


      });
      ws.on('close', () => {
        console.log('WebSocket disconnected');
      });

    });
  }
  private async generateChatMessage(ws, message: any) {
    console.log('message',message)
    const messageString = message.toString();
    const feedback = await this.openAIService.generateText(messageString, ws)
    ws.send(`${feedback}`);
  }

  private isEmptyObject(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
}



