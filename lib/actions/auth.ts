"use server";
import jwt, { JwtPayload } from "jsonwebtoken";
import PrismaClientManager from "../pgConnect";
import bcrypt from "bcryptjs";
import { statusCodes } from "@/app/types/statusCodes";
import { OTP_TYPE, User } from "@/app/types/main";
import nodemailer from "nodemailer";

const officialEmail = process.env.ARCHITECT_EMAIL;
const emailAccessToken = process.env.EMAIL_ACCESS_TOKEN;
const secretKey = process.env.JWT_SECRET_KEY || "bob";
const prisma = PrismaClientManager.getInstance().getPrismaClient();
const OTP_MANAGER: OTP_TYPE[] = [];

export const checkAuthentication = async (token: string): Promise<boolean> => {
  try {
    jwt.verify(token, secretKey); // Verifies the token using the secret key
    return true; // If token is valid, return true
  } catch {
    return false; // If token verification fails, return false
  }
};

export const login = async (
  email: string,
  pass: string
): Promise<{ status: number; token: string }> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return {
        status: statusCodes.NOT_FOUND,
        token: "",
      };
    }

    const validatePass = await bcrypt.compare(pass, user?.hashedPass || "");

    if (!validatePass) {
      return {
        status: statusCodes.UNAUTHORIZED,
        token: "",
      };
    }

    const token = jwt.sign(
      {
        email: user?.email,
        id: user?.id,
        //consider adding organisation and role
      },
      secretKey
    );
    return {
      status: statusCodes.OK,
      token,
    };
  } catch (e) {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      token: "",
    };
  }
};

export const register = async (
  name: string,
  email: string,
  password: string
): Promise<{ status: number; token: string }> => {
  try {
    const hashedPass = await bcrypt.hash(password, 10);

    const duplicateUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (duplicateUser) {
      return {
        status: statusCodes.CONFLICT,
        token: "",
      };
    }

    const new_user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPass,
        hasAccess: false,
      },
    });

    const token = jwt.sign(
      {
        email: new_user.email,
        id: new_user.id,
      },
      secretKey
    );

    return {
      status: statusCodes.CREATED,
      token,
    };
  } catch (e) {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      token: "",
    };
  }
};

//the following section defines the functions to recieve and verify the positions of users.

//This is the return type of the fuction

//pass the jwtToken of the user that you want to get the position of.
export async function getPosition(
  JWTtoken: string
): Promise<{ status: number; user: User | null }> {
  try {
    //getting user id from token
    const jwtParsed = jwt.decode(JWTtoken) as jwt.JwtPayload;
    const userId = jwtParsed.id;
    const userEmail = jwtParsed.email;
    //find user info from DB using id
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      if (user.email == userEmail) {
        //successfull match,and has permission return values
        if (user.hasAccess) {
          const retVal = {
            id: user.id,
            name: user.name,
            organisation: user.organisation,
            role: user.role,
            department: user.department,
          };
          return {
            status: statusCodes.OK,
            user: retVal,
          };
        } else {
          return {
            //not authorised
            status: statusCodes.UNAUTHORIZED,
            user: null,
          };
        }
      } else {
        //illegal request
        return { status: statusCodes.BAD_REQUEST, user: null };
      }
    } else {
      //if the user isnt found
      return { status: statusCodes.NOT_FOUND, user: null };
    }
  } catch {
    //server error
    return { status: statusCodes.INTERNAL_SERVER_ERROR, user: null };
  }
}

export async function checkUserExists(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user) return true;

    return false;
  } catch {
    throw new Error("User not found");
  }
}

export async function changePassword(
  verificationToken: string,
  email: string,
  new_password: string
) {
  try {
    // verify token
    jwt.verify(verificationToken, secretKey);
    // hash it
    const hashedPass = await bcrypt.hash(new_password, 10);
    // update it
    try {
      await prisma.user.update({
        where: {
          email,
        },
        data: {
          hashedPass,
        },
      });

      return {
        status: statusCodes.OK,
      };
    } catch {
      return {
        status: statusCodes.INTERNAL_SERVER_ERROR,
      };
    }
  } catch {
    return { status: statusCodes.BAD_REQUEST };
  }
}

export async function verifyOTP(email: string, otp: number) {
  // find the otp
  const index = OTP_MANAGER.findIndex(
    (item) => item.email === email && item.otp === otp
  );

  // if not found return saying otp is invalid
  if (index == -1) {
    return {
      status: statusCodes.BAD_REQUEST,
      token: "",
    };
  }

  // remove the otp
  OTP_MANAGER.splice(index, 1);
  // generate token to reset password
  const token = jwt.sign({ otp }, secretKey);

  return {
    status: statusCodes.OK,
    token,
  };
}

export async function forgetOTP(email: string) {
  // check if he is an exisitng user
  try {
    const res = await checkUserExists(email);

    if (!res) {
      return { status: statusCodes.BAD_REQUEST };
    }
  } catch (e) {
    return { status: statusCodes.INTERNAL_SERVER_ERROR };
  }

  // generate an otp
  const otpCode = Math.floor(100000 + Math.random() * 900000);

  // send a email
  const transport = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: officialEmail,
      pass: emailAccessToken,
    },
  });

  const htmlContent = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e3e3e3;
      }
      .header {
        text-align: center;
        padding: 20px 0;
      }
      .header h1 {
        color: #2c3e50;
        font-size: 24px;
      }
      .otp-box {
        text-align: center;
        margin: 30px 0;
      }
      .otp-box h2 {
        font-size: 28px;
        color: #3498db;
        margin: 0;
      }
      .content {
        font-size: 16px;
        color: #7f8c8d;
        line-height: 1.6;
        text-align: center;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        font-size: 14px;
        color: #bdc3c7;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Architect Developers</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        <p>Please use the OTP code below to verify your identity:</p>
      </div>
      <div class="otp-box">
        <h2>{{OTP_CODE}}</h2>
      </div>
      <div class="content">
        <p>If you didn’t request this code, please ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; 2024 Architect Developers. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const receiver = {
    from: officialEmail,
    to: email,
    subject: "Password Reset: OTP Verification Code",
    html: htmlContent.replace("{{OTP_CODE}}", otpCode.toString()),
  };

  try {
    const info = await transport.sendMail(receiver);
    console.log("Email sent: " + info.response);
    OTP_MANAGER.push({ otp: otpCode, email });

    // make sure to delete it after 5 min
    setTimeout(() => {
      const index = OTP_MANAGER.findIndex(
        (item) => item.email === email && item.otp === otpCode
      );
      if (index !== -1) {
        OTP_MANAGER.splice(index, 1);
      }
    }, 5 * 60 * 1000);

    return {
      status: statusCodes.OK,
    };
  } catch {
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
    };
  }
}

export async function verifyEmail(token: string) {
  try {
    jwt.verify(token, secretKey);
    const payload = jwt.decode(token) as JwtPayload;
    const email = payload.email as string;

    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user?.hasAccess) {
      return false;
    }

    await prisma.user.update({
      where: {
        email,
      },
      data: {
        hasAccess: true,
      },
    });

    return true;
  } catch {
    return false;
  }
}
