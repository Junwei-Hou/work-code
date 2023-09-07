import { MyWebSocketGateway } from "./webSocket.gateway";
import { Module } from "@nestjs/common";
import { OpenAIModule } from "../openAI/openAI.module"
 
@Module({
    imports: [OpenAIModule],
    providers: [MyWebSocketGateway],
})
export class MyWebSocketModule {
    constructor(private readonly myWebSocketGateway: MyWebSocketGateway) {
        this.myWebSocketGateway.start();
    }
}