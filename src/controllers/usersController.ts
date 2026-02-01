import userModel, { IUser } from "../models/userModel";
import { NextFunction, Request, Response } from "express";
import BaseController from "./baseController";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import { tTokens } from "../types/tokens";
import { Payload } from "../types/payload";
import { types } from "util";

type tUser = Document<unknown, {}, IUser> &
  IUser &
  Required<{
    _id: string;
  }> & {
    __v: number;
  };

const generateToken = (userId: string): tTokens | null => {

  if (!process.env.TOKEN_SECRET) {
    return null;
  }

  const randomValue = Math.random().toString();
  const accessToken = jwt.sign(
    {
      _id: userId,
      random: randomValue,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.TOKEN_EXPIRE_DURATION  || "1h" } as any,
  );
  const refreshToken = jwt.sign(
    {
      _id: userId,
      random: randomValue,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d"  } as any,
  );

  return {
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const verifyRefreshToken = (refreshToken: string | undefined) => {
  return new Promise<tUser>((resolve, reject) => {
    //get refresh token from body
    if (!refreshToken) {
      reject("fail");
      return;
    }

    //verify token
    if (!process.env.TOKEN_SECRET) {
      reject("fail");
      return;
    }

    jwt.verify(
      refreshToken,
      process.env.TOKEN_SECRET,
      async (err: any, payload: any) => {
        if (err) {
          reject("fail");
          return;
        }

        //get the user id fromn token
        const userId = payload._id;

        try {
          //get the user form the db
          const user = await userModel.findById(userId);

          if (!user) {
            reject("fail");
            return;
          }

          if (!user.refreshToken || !user.refreshToken.includes(refreshToken)) {
            user.refreshToken = [];
            await user.save();
            reject("fail");
            return;
          }

          const tokens = user.refreshToken!.filter(
            (token) => token !== refreshToken,
          );
          user.refreshToken = tokens;

          resolve(user);
        } catch (err) {
          reject("fail");
          return;
        }
      },
    );
  });
};
class UsersController extends BaseController<IUser> {
  constructor() {
    super(userModel);

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  async create(req: Request, res: Response) {
    try {
      const password = req.body.password;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;
      }

      await super.create(req, res);
    } catch (error) {
      res.status(400).send(error);
    }
  }

  getFilterFields() {
    return ["username", "email"];
  }

  getUpdateFields() {
    return ["username", "email", "password"];
  }



  async login(req: Request, res: Response) {
    try {
      console.log(req.body)
      const user = await userModel.findOne({
        $or: [
          { email: req.body.email || "" },
          { username: req.body.username || "" },
        ],
      });
      if (!user) {
        res.status(400).send("wrong username/email or password");
        return;
      }

      const validPassword = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!validPassword) {
        res.status(400).send("wrong username/email or password");
        return;
      }

      if (!process.env.TOKEN_SECRET) {
        res.status(500).send("Server Error");
        return;
      }

      const tokens = generateToken((user._id) as string);
      if (!tokens) {
        res.status(500).send("Server Error");
        return;
      }

      if (!user.refreshToken) {
        user.refreshToken = [];
      }
      user.refreshToken.push(tokens.refreshToken);
      await user.save();

      res.status(200).send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
      });
    } catch (err) {
      res.status(400).send(err);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const user = await verifyRefreshToken(req.body.refreshToken);
      await user.save();

      res.status(200).send("success");
    } catch (err) {
      res.status(400).send("fail");
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const user = await verifyRefreshToken(req.body.refreshToken);
      if (!user) {
        res.status(400).send("fail");
        return;
      }

      const tokens = generateToken((user._id) as string);
      if (!tokens) {
        res.status(500).send("Server Error");
        return;
      }

      if (!user.refreshToken) {
        user.refreshToken = [];
      }
      user.refreshToken.push(tokens.refreshToken);
      await user.save();

      res.status(200).send({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        _id: user._id,
      });
    } catch (err) {
      res.status(400).send("fail");
    }
  }
}

export default new UsersController();

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.header("authorization");
  const token = authorization && authorization.split(" ")[1];

  if (!token) {
    res.status(401).send("Access Denied");
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("Server Error");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err: any, payload: any) => {
    if (err) {
      res.status(401).send("Access Denied");
      return;
    }

    res.locals.userId = (payload as Payload)._id;
    next();
  });
};
