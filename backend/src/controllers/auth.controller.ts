import { env } from "@config/env";
import ApiError from "@utils/ApiError";
import ApiResponse from "@utils/ApiResponse";
import { User } from "@modules/User";
import { asyncHandler } from "@utils/asyncHandler";
import { tokenGenerator } from "@utils/tokenGenerator";
import Jwt from "jsonwebtoken";
import { AppInstallationId } from "@utils/AppInstallationDetails";
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL } = env;





export const loginWithGithub = asyncHandler(async (req, res) => {
  const state = await tokenGenerator();

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: "read:user", // keep minimal — repo evidence comes via the App, not OAuth scopes
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});





export const callBackUrl = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
 
  if (!code || !state) {
    throw new ApiError(404, "invalid state", "invalid state data forward");
  }
 
  const verify = Jwt.verify(state as string, env.JWT_SECRET);
  if (!verify) {
    throw new ApiError(401, "token expired", "state token has expired");
  }
 
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_CALLBACK_URL,
    }),
  });
 
  const tokenData = (await tokenResp.json()) as {
    access_token?: string;
    error?: string;
  };
 
  if (!tokenData.access_token) {
    throw new ApiError(400, "oauth exchange failed", tokenData.error ?? "unknown error");
  }
 
  const userResp = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const ghUser = (await userResp.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
 
  if (!ghUser?.id) {
    throw new ApiError(400, "github user fetch failed", "could not resolve github identity");
  }
 
  // Upsert on githubId — the durable identity key. Never upsert on email,
  // since GitHub email can be null if the user keeps it private.
  
  const user = await User.findOneAndUpdate(
    { githubId: ghUser.id },
    {
      $set: {
        login: ghUser.login,
        displayName: ghUser.name,
        email: ghUser.email,
        avatarUrl: ghUser.avatar_url,
        authProvider: "github",
        lastLoginAt: new Date(),
      },
      $setOnInsert: {
        role: "member",
        isActive: true,
      },
      $inc: { loginCount: 1 },
    },
    { upsert: true, new: true },
  );
 
  // Session token — this is what the client uses going forward, not GitHub's token.
  const sessionToken = Jwt.sign(
    { userId: user._id.toString(), githubId: user.githubId, login: user.login },
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
 
  // Set as an httpOnly cookie so it isn't accessible to client-side JS (XSS-safer
  // than returning it in a JSON body for the frontend to store in localStorage).
  res.cookie("session_token", sessionToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT expiry
  });
 
  // If the user hasn't installed the App yet, send them to install it next.
  if (!user.installationId) {
    return res.redirect(
      `https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`,
    );
  }
 
  // Already installed — go straight to the app.
  return res.redirect(`http://localhost:${5173}`);
});
 


export const app_callback=asyncHandler(async(req,res)=>{
  const {installation_id,setup_action}=req?.query;

  const token=req.cookies?.session_token
  const decode:any=Jwt.verify(token,  env.JWT_SECRET)
   const installationData:any = await AppInstallationId(
    installation_id as string
  );
  // 
   const user = await User.findByIdAndUpdate(
    decode.userId,
    {
      $set: {
        installationId: installationData.id,

        // User or Organization
        installationAccountType: installationData.account.type,

        // GitHub login/name of installer account
        installationAccountLogin: installationData.account.login,

        // Permissions selected for your GitHub App
        installationPermissions: installationData.permissions,

        installationSuspendedAt: installationData.suspended_at,

        // setup_action = install/update
        installationAction: setup_action,

        installedAt: new Date(),
      },
    },
    { new: true }
  );

  return res.redirect(`http://localhost:${5173}`);
})

export const logout=asyncHandler(async(req,res,next)=>{
  const githubId=req.user?.githubId
  const userId=req.user?.userId;

  const user=await User.findOne({_id:userId ,githubId});
  if(!user)
      return new ApiError(404,"not permitted","user cannot found");
  user.loginCount-=1;
  await user.save({validateBeforeSave:true})
  res.cookie("session_token","");
  res.send();
})

export const authMe=asyncHandler(async(req,res,next)=>{
  const userId=req?.user?.userId;
  const githubId=req.user?.githubId;
  if(!userId ||!githubId){
    return new ApiError(404,"userId,githubId","token not found")
  }
  const user =await User.findOne({_id:userId ,githubId:githubId},{_id:1,displayName:1,login:1,avatarUrl:1,role:1,installationId:1,installedAt:1,loginCount:1,lastLoginAt:1,email:1});
  console.log(user,"me")
  if(!user||user==null)
   {
      res.cookie("session_token","")
      res.redirect("http://localhost:5173/login")
     new ApiError(404,"user not found","user is not found in database")
     
   }
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  return new ApiResponse(200,"user profile fetched successfuly",user).send(res);

})