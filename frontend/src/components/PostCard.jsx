"use client";
import React from "react";
import { motion } from "framer-motion";
import { supabase } from "@/config/supabaseClient";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGlobalUser } from "../config/UserContext";

const PostCard = ({ post, onFollow, isFollowing, showFollowButton = true }) => {
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const router = useRouter();
  const currentUser = useGlobalUser();

  useEffect(() => {
    setIsCurrentUser(currentUser?.id === post.author_id);
  }, [currentUser, post.author_id]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    // Convert UTC to local time
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return localDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const handleFollowClick = async () => {
    if (!currentUser) {
      router.push("/login?redirect=/posts");
      return;
    }
    onFollow(post.author_id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
              {post.author_name}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(post.created_at)}
            </p>
          </div>
        </div>
        {showFollowButton && (
          <button
            onClick={handleFollowClick}
            disabled={isCurrentUser}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isCurrentUser
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : isFollowing
                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {isCurrentUser ? "Your Post" : isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
      <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-lg leading-relaxed pl-13">
        {post.content}
      </div>
    </motion.div>
  );
};

export default PostCard;
