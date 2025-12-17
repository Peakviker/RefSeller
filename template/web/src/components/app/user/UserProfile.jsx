import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user }) => {
    const getProfilePhoto = () => {
        return user?.photo_url || null;
    };

    const getInitials = () => {
        if (user?.first_name) {
            return user.first_name.charAt(0).toUpperCase();
        }
        return '?';
    };

    return (
        <div className="user-profile">
            <div className="user-avatar">
                {getProfilePhoto() ? (
                    <img src={getProfilePhoto()} alt="Profile" />
                ) : (
                    <div className="user-avatar-placeholder">
                        {getInitials()}
                    </div>
                )}
            </div>
            <div className="user-info-block">
                <h2 className="user-name">
                    {user?.first_name} {user?.last_name}
                </h2>
                <p className="user-username">
                    @{user?.username || 'неизвестно'}
                </p>
            </div>
        </div>
    );
};

export default UserProfile;

