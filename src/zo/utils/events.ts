import { BorshCoder, Idl } from "@project-serum/anchor";
import { DEX_IDL } from "../types/dex.js";
import { IDL } from "../types/zo.js";

function decodeMsg(coder: BorshCoder<string>, msg: string) {
  const event = coder.events.decode(msg);
  if (event) {
    return event;
  }
  return null;
}

export function decodeDexEvent(msg: string) {
  try {
    const coder = new BorshCoder(DEX_IDL as Idl);
    return decodeMsg(coder, msg);
  } catch (_) {
    return null;
  }
}

export function decodeZoEvent(msg: string) {
  try {
    const coder = new BorshCoder(IDL as Idl);
    return decodeMsg(coder, msg);
  } catch (_) {
    return null;
  }
}

export function decodeEvent(msgRaw: string) {
  try {
    const msg =
      msgRaw.split("Program log: ")[msgRaw.split("Program log: ").length - 1]!;
    const dexMsg = decodeDexEvent(msg);
    if (dexMsg) {
      return dexMsg;
    }
    return decodeZoEvent(msg);
  } catch (_) {
    return {};
  }
}
