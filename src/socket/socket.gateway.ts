import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { AdminUser } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { Panel, TokenType } from 'src/jwt/jwt.dto';
import { JwtService } from 'src/jwt/jwt.service';

@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);
  @WebSocketServer() server: Server;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.server = new Server();
  }

  afterInit() {
    this.logger.log(' WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate the user
      const authHeader = client.handshake.auth.Authorization
        ? client.handshake.auth.Authorization
        : client.handshake.headers.authorization;

      if (!authHeader) throw new WsException('Authorization header missing.');

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer')
        throw new WsException('Invalid authorization type.');

      const user = await this.activateForAdmin(token);

      // Join the apartment room
      const apartmentId = user.apartmentId;
      await client.join(apartmentId);
      client.data.user = user;

      this.logger.debug(
        `Client ${client.id} joined apartment room: ${apartmentId}`,
      );
    } catch (error) {
      this.handleError(client, error);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      this.logger.debug(`${user.name} disconnected`);
    } else {
      this.logger.debug('Unauthenticated client disconnected');
    }
  }

  private async activateForAdmin(token: string): Promise<AdminUser> {
    const payload = this.jwtService.decodeToken(
      token,
      Panel.ADMIN,
      TokenType.ACCESS,
    );

    if (!payload) throw new WsException('Token is not valid');

    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.id, NOT: { archive: true } },
    });

    if (!user) throw new WsException('User is not valid.');

    if (user.blockedToken === token)
      throw new WsException('Session is blocked');

    return user;
  }

  private handleError(client: Socket, error: any) {
    this.logger.error(`WebSocket Error: ${error.message}`, error.stack);
    client.emit('error', error);
    client.disconnect();
  }
}

// @SubscribeMessage('ping')
// async handleMessage(
//   @MessageBody() data: { status: CheckInOutStatusEnum },
//   @ConnectedSocket() client: any,
// ) {
//   if (!Object.values(CheckInOutStatusEnum).includes(data.status)) {
//     this.server.emit('response', {
//       success: false,
//       message: 'Status does not exist',
//     });
//     return;
//   }

//   const updatedRequest = await this.prisma.checkInOutRequest.update({
//     where: { id: '032c12ee-0768-4f45-8e1b-30bb1c414420' },
//     data: {
//       status: data.status,
//       approvedByGuardId: client.user.id,
//     },
//   });

//   this.server.emit('response', { success: true, data: updatedRequest });

//   return updatedRequest;
// }

// async activateForGuard(token: string): Promise<GuardUser> {
//   const payload = this.jwtService.decodeToken(
//     token,
//     Panel.GUARD,
//     TokenType.ACCESS,
//   );

//   if (!payload) throw new WsException('Token is not valid');

//   const user = await this.prisma.guardUser.findUnique({
//     where: {
//       id: payload.id,
//       NOT: {
//         archive: true,
//       },
//     },
//   });

//   if (!user) throw new WsException('User is not valid.');

//   if (user.blockedToken === token)
//     throw new WsException('Session is blocked');

//   return user;
// }
