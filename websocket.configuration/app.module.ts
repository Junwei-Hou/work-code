import * as winston from "winston";
import * as rotateFile from "winston-daily-rotate-file";
import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule, MongooseModuleAsyncOptions } from "@nestjs/mongoose";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/config.service";
import { AuthModule } from "../auth/auth.module";
import { ProfileModule } from "../profile/profile.module";
import { WinstonModule } from "../winston/winston.module";
import { GameUsersModule } from "../gameUsers/gameUsers.module";
import { FoodCourtModule } from "../foodCourt/foodCourt.module";
import { KitchenModule } from "../kitchen/kitchen.module";
import { EmployeeModule } from "../employee/employee.module";
import { DiningTableModule } from "../diningTable/diningTable.module"
import { ItemModule } from "../item/item.module"
import { EmailModule } from "../email/email.module"
import { SignboardModule } from "../signboard/signboard.module"
import { ParkingLotModule } from "../parkingLot/parkingLot.module"
import { MediaModule } from "../media/media.module";
import { TutorialModule } from "../tutorial/tutorial.module";

import { OpenAIModule } from "../openAI/openAI.module"
import { AccessControlModule } from "nest-access-control";
import { roles } from "./app.roles";
import { ServeStaticModule } from '@nestjs/serve-static';
import { MyWebSocketModule } from '../webSocket/webSocket.module'
import { join } from 'path';
@Module({
  imports: [

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          uri: configService.get("DB_URL"),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        } as MongooseModuleAsyncOptions),
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return configService.isEnv("dev")
          ? {
              level: "info",
              format: winston.format.json(),
              defaultMeta: { service: "user-service" },
              transports: [
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
              ],
            }
          : {
              level: "info",
              format: winston.format.json(),
              defaultMeta: { service: "user-service" },
              transports: [
                new winston.transports.File({
                  filename: "logs/error.log",
                  level: "error",
                }),
                new winston.transports.Console({
                  format: winston.format.simple(),
                }),
                new rotateFile({
                  filename: "logs/application-%DATE%.log",
                  datePattern: "YYYY-MM-DD",
                  zippedArchive: true,
                  maxSize: "20m",
                  maxFiles: "14d",
                }),
              ],
            };
      },
    }),
    AccessControlModule.forRoles(roles),
    MyWebSocketModule,
    ConfigModule,
    AuthModule,
    ProfileModule,
    GameUsersModule,
    MediaModule,
    FoodCourtModule,
    KitchenModule,
    EmployeeModule,
    DiningTableModule,
    ParkingLotModule,
    SignboardModule,
    ItemModule,
    EmailModule,
    OpenAIModule,
    TutorialModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..','..','..', '/public/uploads'),
      serveRoot: '/static',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}