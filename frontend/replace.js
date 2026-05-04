const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\Abdulkadir\\Cosmic_Connect\\frontend\\src\\pages\\Messages.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Inject imports
const importString = `import { MatchesTab, ConversationsTab, FriendsTab, RequestsTab } from '../components/messages/MessageTabs';\n`;
if (!content.includes('MessageTabs')) {
    content = content.replace(/^import React.*$/m, `$&` + '\n' + importString);
}


// Replace matches
content = content.replace(
    /\{activeTab === 'matches' && \([\s\S]*?key="matches"[\s\S]*?<\/motion\.div>\s*\)\}/,
    `{activeTab === 'matches' && <MatchesTab newMatches={newMatches} user={user} setShowPremiumModal={setShowPremiumModal} setMatchModalFriend={setMatchModalFriend} setActiveChat={setActiveChat} />}`
);

// Replace messages
content = content.replace(
    /\{activeTab === 'messages' && \([\s\S]*?key="messages"[\s\S]*?<\/motion\.div>\s*\)\}/,
    `{activeTab === 'messages' && <ConversationsTab activeConversations={activeConversations} userId={userId} swipedChatId={swipedChatId} setSwipedChatId={setSwipedChatId} handleDeleteChat={handleDeleteChat} showToast={showToast} setActiveChat={setActiveChat} setExtendTargetFriend={setExtendTargetFriend} setShowExtendModal={setShowExtendModal} />}`
);

// Replace friends
content = content.replace(
    /\{activeTab === 'friends' && \([\s\S]*?key="friends"[\s\S]*?<\/motion\.div>\s*\)\}/,
    `{activeTab === 'friends' && <FriendsTab actualFriends={actualFriends} isTeller={isTeller} setActiveChat={setActiveChat} />}`
);

// Replace requests
content = content.replace(
    /\{activeTab === 'requests' && \([\s\S]*?key="requests"[\s\S]*?<\/motion\.div>\s*\)\}/,
    `{activeTab === 'requests' && <RequestsTab requests={requests} isPremium={isPremium} friendReqRemaining={friendReqRemaining} actionLoading={actionLoading} setActionLoading={setActionLoading} setRequests={setRequests} setFriendReqRemaining={setFriendReqRemaining} setFriends={setFriends} showToast={showToast} />}`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully replaced all tab contents!');
