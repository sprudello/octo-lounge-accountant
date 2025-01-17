﻿namespace octo_lounge_accountant_api.Models
{
    public class Profile
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
