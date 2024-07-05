import { NewSgridServer, NewSgridServerCtx } from "sgridnode/build/main";
import express from 'express'
function boost() {
  const ctx = NewSgridServerCtx();
  ctx.use('/web',express.static("./public"))
  NewSgridServer(ctx);
}

boost();
