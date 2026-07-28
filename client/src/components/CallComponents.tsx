"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSocket, emitSocket, onSocket, offSocket } from "@/lib/socket";
import { cn, formatDuration } from "@/lib/utils";

interface CallState {
  isActive: boolean;
  type: "VOICE" | "VIDEO";
  status: "OUTGOING" | "INCOMING" | "ACCEPTED" | "ENDED";
  callId?: number;
  targetId: number;
  targetName: string;
  targetAvatar: string | null;
  callerId?: number;
  callerName?: string;
  callerAvatar?: string | null;
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOff: boolean;
}

interface IncomingCallDialogProps {
  callerName: string;
  callerAvatar: string | null;
  callType: "VOICE" | "VIDEO";
  callId: number;
  callerId: number;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallDialog({
  callerName,
  callerAvatar,
  callType,
  onAccept,
  onReject,
}: IncomingCallDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-[#101826] border border-[#1B2434] rounded-3xl p-8 shadow-2xl w-[340px] text-center">
        {/* Caller avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mb-4"
        >
          <Avatar className="h-24 w-24 mx-auto border-4 border-primary/30">
            <AvatarImage src={callerAvatar || undefined} />
            <AvatarFallback name={callerName} className="text-3xl" />
          </Avatar>
        </motion.div>

        <h3 className="text-xl font-bold text-white mb-1">{callerName}</h3>
        <p className="text-white/40 text-sm mb-8">
          Incoming {callType.toLowerCase()} call...
        </p>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onReject}
            className="w-16 h-16 gradient-red rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            onClick={onAccept}
            className="w-16 h-16 gradient-green rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <Phone className="h-7 w-7 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

interface CallScreenProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
}

export function CallScreen({
  callState,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
}: CallScreenProps) {
  const { type, status, targetName, targetAvatar, duration, isMuted, isVideoOff, isSpeakerOff } = callState;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[#060B16]"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center">
        {/* Status */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/40 text-sm mb-6"
        >
          {status === "OUTGOING" && "Calling..."}
          {status === "INCOMING" && "Incoming call..."}
          {status === "ACCEPTED" && formatDuration(duration)}
          {status === "ENDED" && "Call ended"}
        </motion.p>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <Avatar className="h-32 w-32 border-4 border-primary/20">
            <AvatarImage src={targetAvatar || undefined} />
            <AvatarFallback name={targetName} className="text-4xl" />
          </Avatar>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-1">{targetName}</h2>
        <p className="text-white/40 text-sm">
          {type === "VOICE" ? "Voice Call" : "Video Call"}
        </p>

        {/* Call type indicator */}
        {type === "VIDEO" && !isVideoOff && (
          <div className="mt-6 w-[300px] h-[200px] bg-[#101826] rounded-2xl border border-[#1B2434] flex items-center justify-center">
            <Video className="h-12 w-12 text-white/20" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative pb-12 pt-6">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleMute}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              isMuted
                ? "bg-white/20 text-white"
                : "bg-[#101826] text-white/70 hover:text-white border border-[#1B2434]"
            )}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </motion.button>

          {/* Video toggle (only for video calls) */}
          {type === "VIDEO" && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onToggleVideo}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isVideoOff
                  ? "bg-white/20 text-white"
                  : "bg-[#101826] text-white/70 hover:text-white border border-[#1B2434]"
              )}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </motion.button>
          )}

          {/* Speaker */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleSpeaker}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              isSpeakerOff
                ? "bg-white/20 text-white"
                : "bg-[#101826] text-white/70 hover:text-white border border-[#1B2434]"
            )}
          >
            {isSpeakerOff ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </motion.button>

          {/* End Call */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onEndCall}
            className="w-16 h-16 gradient-red rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
          >
            <PhoneOff className="h-7 w-7 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Hook for managing call state
export function useCall() {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: "VOICE",
    status: "OUTGOING",
    targetId: 0,
    targetName: "",
    targetAvatar: null,
    duration: 0,
    isMuted: false,
    isVideoOff: false,
    isSpeakerOff: false,
  });

  const [incomingCall, setIncomingCall] = useState<{
    callId: number;
    callerId: number;
    callerName: string;
    callerAvatar: string | null;
    callType: "VOICE" | "VIDEO";
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const socket = getSocket();

    onSocket("call:incoming", (data: any) => {
      setIncomingCall({
        callId: data.call.id,
        callerId: data.caller.id,
        callerName: data.caller.profile?.fullName || data.caller.username,
        callerAvatar: data.caller.avatar,
        callType: data.call.type,
      });
    });

    onSocket("call:accepted", (data: any) => {
      setCallState((prev) => ({ ...prev, status: "ACCEPTED", callId: data.callId }));
      startTimer();
    });

    onSocket("call:rejected", () => {
      endCall();
    });

    onSocket("call:ended", () => {
      endCall();
    });

    return () => {
      offSocket("call:incoming");
      offSocket("call:accepted");
      offSocket("call:rejected");
      offSocket("call:ended");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setCallState((prev) => ({ ...prev, duration: 0 }));
    timerRef.current = setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  const initiateCall = useCallback(
    async (targetId: number, targetName: string, targetAvatar: string | null, type: "VOICE" | "VIDEO") => {
      // Get media stream for video calls
      if (type === "VIDEO") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
        } catch (err) {
          console.error("Failed to get media:", err);
        }
      }

      setCallState({
        isActive: true,
        type,
        status: "OUTGOING",
        targetId,
        targetName,
        targetAvatar,
        duration: 0,
        isMuted: false,
        isVideoOff: false,
        isSpeakerOff: false,
      });

      emitSocket("call:initiate", { targetId, type });
    },
    []
  );

  const acceptCall = useCallback(() => {
    if (incomingCall) {
      emitSocket("call:accept", { callId: incomingCall.callId });
      setCallState((prev) => ({
        ...prev,
        isActive: true,
        callId: incomingCall.callId,
        targetId: incomingCall.callerId,
        targetName: incomingCall.callerName,
        targetAvatar: incomingCall.callerAvatar,
        type: incomingCall.callType,
        status: "ACCEPTED",
      }));
      setIncomingCall(null);
      startTimer();
    }
  }, [incomingCall, startTimer]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      emitSocket("call:reject", { callId: incomingCall.callId });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (callState.callId) {
      emitSocket("call:end", { callId: callState.callId });
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCallState({
      isActive: false,
      type: "VOICE",
      status: "OUTGOING",
      targetId: 0,
      targetName: "",
      targetAvatar: null,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOff: false,
    });
  }, [callState.callId]);

  const toggleMute = useCallback(() => {
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const toggleVideo = useCallback(() => {
    setCallState((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCallState((prev) => ({ ...prev, isSpeakerOff: !prev.isSpeakerOff }));
  }, []);

  return {
    callState,
    incomingCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
  };
}
