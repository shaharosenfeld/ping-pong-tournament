import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Users, MapPin, Trophy, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, isBefore, isAfter } from 'date-fns';

interface TournamentCardProps {
  id: string;
  title: string;
  location: string;
  date: Date;
  participantsCount: number;
  maxParticipants: number;
  registrationDeadline: Date;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  prizePool?: string;
  imageSrc?: string;
  index?: number; // For staggered animations
}

export default function TournamentCard({
  id,
  title,
  location,
  date,
  participantsCount,
  maxParticipants,
  registrationDeadline,
  level,
  prizePool,
  imageSrc,
  index = 0
}: TournamentCardProps) {
  const isRegistrationClosed = isBefore(new Date(registrationDeadline), new Date());
  const isPastTournament = isBefore(new Date(date), new Date());
  const isUpcoming = isAfter(new Date(date), new Date());
  
  // Calculate status and associated styling
  const getStatus = () => {
    if (isPastTournament) return { text: 'Completed', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };
    if (isRegistrationClosed) return { text: 'Registration Closed', bgColor: 'bg-amber-100', textColor: 'text-amber-700' };
    if (participantsCount >= maxParticipants) return { text: 'Full', bgColor: 'bg-red-100', textColor: 'text-red-700' };
    return { text: 'Open', bgColor: 'bg-green-100', textColor: 'text-green-700' };
  };
  
  const status = getStatus();
  
  // Get date display format
  const getDateText = () => {
    if (isPastTournament) return `${formatDistanceToNow(new Date(date))} ago`;
    return `in ${formatDistanceToNow(new Date(date))}`;
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    hover: { 
      y: -5,
      boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.div
      className="rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      layoutId={`tournament-${id}`}
    >
      <Link href={`/tournaments/${id}`} className="block h-full w-full">
        <div className="relative">
          {/* Tournament Image */}
          <div 
            className="h-48 bg-gradient-to-br from-indigo-500 to-violet-500 relative overflow-hidden"
            style={imageSrc ? { backgroundImage: `url(${imageSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            {/* Overlay for better text readability when there's an image */}
            {imageSrc && <div className="absolute inset-0 bg-black bg-opacity-30" />}
            
            {/* Status badge */}
            <div className={`absolute top-4 right-4 py-1 px-3 rounded-full text-sm font-medium ${status.bgColor} ${status.textColor}`}>
              {status.text}
            </div>
            
            {/* Tournament level */}
            <div className="absolute bottom-4 left-4 text-white font-medium flex items-center">
              <div className="bg-black bg-opacity-50 backdrop-blur-sm py-1 px-3 rounded-full text-sm">
                {level}
              </div>
            </div>
          </div>
          
          {/* Tournament Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1">{title}</h3>
            
            <div className="space-y-2 mt-3">
              {/* Location */}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-2 opacity-70" />
                <span className="truncate">{location}</span>
              </div>
              
              {/* Date */}
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2 opacity-70" />
                <span>{date.toLocaleDateString()} ({getDateText()})</span>
              </div>
              
              {/* Participants */}
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-2 opacity-70" />
                <span>
                  <span className={participantsCount >= maxParticipants ? "text-red-600 font-medium" : ""}>
                    {participantsCount}
                  </span>
                  /{maxParticipants} participants
                </span>
              </div>
              
              {/* Prize Pool if available */}
              {prizePool && (
                <div className="flex items-center text-sm text-gray-600">
                  <Trophy size={16} className="mr-2 opacity-70" />
                  <span>Prize pool: {prizePool}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* CTA */}
          <div className="border-t border-gray-100 p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              {isPastTournament 
                ? "View results" 
                : isRegistrationClosed 
                  ? "Registration closed" 
                  : "View details"}
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 