﻿using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using octo_lounge_accountant_api.Data;
using octo_lounge_accountant_api.Models;
using octo_lounge_accountant_api.ModelsDTO;
using System.Security.Cryptography;
using System.Text;

namespace octo_lounge_accountant_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfilesController : ControllerBase
    {
        private readonly DataContext _context;

        public ProfilesController(DataContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Registration([FromBody] ProfileDTO profileDto)
        {
            if (profileDto == null)
            {
                return BadRequest("Profile data is null.");
            }

            // Check if username already exists
            if (await _context.Profiles.AnyAsync(p => p.Username == profileDto.Username))
            {
                return BadRequest("Username already exists.");
            }

            // Encrypt the password
            var encryptedPassword = EncryptPassword(profileDto.PasswordHash);

            var profile = new Profile
            {
                Username = profileDto.Username,
                Email = profileDto.Email,
                PasswordHash = encryptedPassword,
            };

            try
            {
                _context.Profiles.Add(profile);
                await _context.SaveChangesAsync();
                
                // Fetch the newly created profile to ensure it exists
                var createdProfile = await _context.Profiles.FindAsync(profile.Id);
                if (createdProfile == null)
                {
                    return StatusCode(500, "Profile creation failed");
                }

                return Ok(createdProfile);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Profile creation failed: {ex.Message}");
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO loginDto)
        {
            if (loginDto == null)
            {
                return BadRequest("Login data is null.");
            }

            var profile = await _context.Profiles.SingleOrDefaultAsync(p => p.Username == loginDto.username);
            if (profile == null)
            {
                return Unauthorized("Invalid username or password.");
            }

            // Hash the login password attempt the same way as registration
            var hashedLoginAttempt = EncryptPassword(loginDto.password);
            // Compare the hashed attempt with stored hash
            if (!string.Equals(profile.PasswordHash, hashedLoginAttempt, StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized("Invalid username or password.");
            }

            return Ok(profile);
        }

        private string EncryptPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}
