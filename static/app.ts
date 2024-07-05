import { NewSgridServer, NewSgridServerCtx } from "sgridnode/build/main";
import express from 'express'
import path from 'path';
function boost() {
  const ctx = NewSgridServerCtx();
  ctx.use('/docs/',express.static(path.resolve(__dirname,"./dist") ))
  NewSgridServer(ctx);
}

boost();
