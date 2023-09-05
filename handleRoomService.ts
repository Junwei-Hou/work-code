import * as crypto from 'crypto';
import * as gravatar from 'gravatar';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import {
  IRooms,
  Rooms,
  IRoomsAreas,
  RoomsAreas,
  IRoomsUsers,
  RoomsUsers,
  IRoomsAreaUsers,
  RoomsAreaUsers,
} from './rooms.model';
import { AppRoles } from '../app/app.roles';
import { RoomsPayload, AreasPayload, UsersPayload } from './payload';
import { ObjectId } from 'mongodb';
import { ConfigService } from '../config/config.service';
import * as jwt from 'jsonwebtoken';
/**
 * Rooms Service
 */
interface JwtPayload {
  userId: string;
  // 其他属性
}
export enum RoomUserAction {
  ROOM_ENTER = 'ROOM_ENTER',
  ROOM_LEAVE = 'ROOM_LEAVE',
  ROOM_MUTE = 'ROOM_MUTE',
  ROOM_BAN = 'ROOM_BAN',
  // ... ... more action
}
@Injectable()

export class RoomsService {
  /**
   * Constructor
   * @param {Model<IRooms>} roomsModel
   * @param {Model<IRoomsUsers>} roomsUsersModel
   * @param {Model<IRoomsAreas>} roomsAreasModel
   * @param {Model<IRoomsAreaUsers>} roomsAreaUsersModel
   */
  constructor(
    @InjectModel('rooms') private readonly roomsModel: Model<IRooms>,
    @InjectModel('rooms_users')
    private readonly roomsUsersModel: Model<IRoomsUsers>,
    @InjectModel('rooms_areas')
    private readonly roomsAreasModel: Model<IRoomsAreas>,
    @InjectModel('rooms_area_users')
    private readonly roomsAreaUsersModel: Model<IRoomsAreaUsers>,

    private configService: ConfigService,
  ) { }

  /**
   * Create a room with RoomsPayload fields
   * @param {RoomsPayload} payload rooms payload
   * @returns {Promise<IRooms>} created rooms data
   */
  async createRoom(payload: RoomsPayload): Promise<IRooms> {
    const room = await this.roomsModel
      .findOne({ roomName: payload.roomName })
      .exec();
    if (room) {
      throw new NotAcceptableException(
        'The roomName currently exists. Please choose another one.',
      );
    }
    const createdRoom = new this.roomsModel({
      userId: '',
      ...payload,
      roomId: new ObjectId(),
      mute: payload.mute || false,
      type: payload.type || 'public',
      status: payload.status || 'open',
      isActive: payload.isActive || true,
    });
    return createdRoom.save();
  }

  /**
   * @returns {Promise<IRooms>} queried room data
   */
  async getAllRooms(): Promise<IRooms[]> {
    return await this.roomsModel
      .find({}, 'roomName roomId roomTemplateCode')
      .exec();
  }

  /**
   * Create a roomUsers with UsersPayload fields
   * @param {UsersPayload} payload roomUsers payload
   * @returns {Promise<IRoomsUsers>} created roomUsers data
   *
   * Create a roomUsers with UsersPayload fields
   * @param {AreasPayload} payload roomUsers payload
   * @returns {Promise<IRoomsAreas>} created roomUsers data
   */

  async getUserIdByToken(token: any): Promise<any> {
    let { userId } = jwt.verify(
      token,
      this.configService.get('WEBTOKEN_SECRET_KEY'),
    ) as JwtPayload; 
    return userId
  }

  async handleOvertime(token: any): Promise<any> {
    // get userId from token
    let { userId } = jwt.verify(
      token,
      this.configService.get('WEBTOKEN_SECRET_KEY'),
    ) as JwtPayload; 

    // check if the user is in the room
    let roomUser = await this.roomsUsersModel.findOne({
      userId: userId,
      status: 'open',
      isDeleted: true,
    }).exec();

    // no existed
    if (!roomUser) {
      return 
    }
    // existed
    await this.handleUserLeft(userId)
    return
  }

  // room play rules:
  // set MaxNumber and WarnNumber, firstly, users will jump into room, and then go into each area in room, the hierarchy is room => area
  // there are 3 collections, 'rooms_users' 'rooms_areas' 'rooms_area_users'
  // 1. if all users in areas reach MaxNumber, then create new area enable user to go in
  // 2. if there are users in areas below WarnNumber, then user will go in as priority 
  // 3. if all areas users in there which is over WarnNumber and below MaxNumber, then user will go in
  async handleRoomAreaUsers(message: any, userId: string): Promise<any> {
    const MaxNumber = 5; // set maximum ppl 
    const WarnNumber = 3; // set warning ppl
    const messageObj = JSON.parse(message); // get message from websocket
    let roomId = messageObj.data.roomId; // get roomId from websocket
    // let { userId } = jwt.verify(
    //   token,
    //   this.configService.get('WEBTOKEN_SECRET_KEY'),
    // ) as JwtPayload; // get userId from token

    // check if room user had already in the room
    let roomUser = await this.roomsUsersModel.findOne({
      userId: userId,
      status: 'open',
      isDeleted: true,
    })
    .exec();

    // handle various action from websocket
    switch (messageObj.type) {
      // websocket message : ROOM_ENTER
      case RoomUserAction.ROOM_ENTER:
        if (roomUser) {
          let roomsAreaUsers = await this.roomsAreaUsersModel
            .findOne({
              userId: userId,
              status: 'open',
              isDeleted: true
            })
            .exec();
          let areaId = roomsAreaUsers ? roomsAreaUsers.areaId : ''
          return this.messageSendBack('ROOM_ENTER_MSG', 'The room user has already existed in this room.', areaId); // if user has existed in room, send areaId back 
        }

        let createRoomUser = new this.roomsUsersModel({
          userId,
          roomId: roomId,
          status: 'open',
          isDeleted: true,
        });
        await createRoomUser.save();// once user into room, generate room user form data

        let availableAreas = []
        let warnLessAreas = []
        let warnMoreAreas = []

        const roomsAreas = await this.roomsAreasModel.find({
          roomId: roomId,
          status: 'open',
          isDeleted: true,
        }).sort({ createdAt: 1 }).exec(); // get all rooms area by roomId

        const countEachArea = await Promise.all(
          roomsAreas.map(async (item) => {
            const count = await this.roomsAreaUsersModel
              .countDocuments({ areaId: item.areaId })
              .exec();
            let res = JSON.parse(JSON.stringify(item))
            return { ...res, count };
          }),
        );//countEachArea has each room area user data and user number in their area

        for (var i = 0; i < countEachArea.length; i++) {
          if (countEachArea[i].count >= MaxNumber) {
            continue;
          } else {
            availableAreas.push(countEachArea[i]);// there are areas user can be fit in
            if (countEachArea[i].count < WarnNumber) {
              warnLessAreas.push(countEachArea[i]);// there are areas < WarnNumber, user can be fit in
            } else {
              warnMoreAreas.push(countEachArea[i]);// there are areas all > WarnNumber, user can be fit in
            }
          }
        }

        if (availableAreas.length === 0) {
          const areaId = new ObjectId();

          await this.createRoomArea(roomId, areaId);
          await this.createRoomAreaUser(roomId, areaId, userId);
          return this.messageSendBack('ROOM_ENTER_MSG', '', areaId);
        }

        if (warnLessAreas.length > 0) {
          await this.createRoomAreaUser(
            roomId,
            warnLessAreas[0].areaId,
            userId,
          );

          return this.messageSendBack('ROOM_ENTER_MSG', '', warnLessAreas[0].areaId);
        }

        if (warnMoreAreas.length > 0) {
          await this.createRoomAreaUser(
            roomId,
            warnMoreAreas[0].areaId,
            userId,
          );

          return this.messageSendBack('ROOM_ENTER_MSG', '', warnMoreAreas[0].areaId);
        }
        break;

      case RoomUserAction.ROOM_LEAVE:
        // websocket message : ROOM_LEAVE
        if (!roomUser) {
          return this.messageSendBack('ROOM_LEAVE_MSG', 'User does not existed in this room', '')
        }
        await this.handleUserLeft(userId)
        return this.messageSendBack('ROOM_LEAVE_MSG', 'The room user has left', '')

      case RoomUserAction.ROOM_MUTE:
        // websocket message : ROOM_MUTE
        break;

      case RoomUserAction.ROOM_BAN:
        // websocket message : ROOM_BAN
        break;
      default:
    }
  }

  messageSendBack(type: string, message: string, areaId: any) {
    switch (type) {
      case 'ROOM_ENTER_MSG':
        return JSON.stringify({
          type: 'ROOM_ENTER_MSG',
          data: {
            msg: message,
            areaId: areaId,
          },
        });
      case 'ROOM_LEAVE_MSG':
        return JSON.stringify({
          type: 'ROOM_LEAVE_MSG',
          data: {
            msg: message,
            areaId: areaId,
          },
        });
      default:
        return ''
    }
  }

  // 当玩家进入房间之后，接着会生成房间与区关系表
  async createRoomArea(roomId: string, areaId: any) {
    const createRoomArea = new this.roomsAreasModel({
      roomId: roomId,
      areaId: areaId,
      status: 'open',
      isDeleted: true,
    });
    await createRoomArea.save();
  }
  // 当玩家进入房间之后，接着会生成房间与区与玩家关系表
  async createRoomAreaUser(roomId: string, areaId: any, userId: string) {
    const createRoomAreaUser = new this.roomsAreaUsersModel({
      roomId: roomId,
      areaId: areaId,
      userId,
      status: 'open',
      isDeleted: true,
    });
    await createRoomAreaUser.save();
  }

  // Once user left
  async handleUserLeft(userId:string){
    let userRoomArea = await this.roomsAreaUsersModel.findOne({
      userId: userId,
      status: 'open',
      isDeleted: true
    });
    let areaId = userRoomArea ? userRoomArea.areaId : null; // get areaId by userId
    if (areaId !== null) {
      let count = await this.roomsAreaUsersModel.countDocuments({ areaId: areaId });
      if (count === 1) {
        await this.destroyRoomArea(areaId);
      }
      await this.destroyRoomUser(userId);
      await this.destroyRoomAreaUser(areaId, userId);
      return this.messageSendBack('ROOM_LEAVE_MSG', 'The room user has left', '')
    }
  }

  // 当玩家离开房间之后，接着会删除房间与用户关系表
  async destroyRoomUser(userId) {
    await this.roomsUsersModel.deleteOne({ userId: userId });
  }

  // 当玩家离开房间之后，接着会删除房间与区关系表
  async destroyRoomArea(areaId) {
    await this.roomsAreasModel.deleteOne({ areaId: areaId });
  }

  // 当玩家离开房间之后，接着会删除房间与区与玩家关系表
  async destroyRoomAreaUser(areaId: any, userId: any) {
    await this.roomsAreaUsersModel.deleteOne({ areaId: areaId, userId: userId });
  }
}

