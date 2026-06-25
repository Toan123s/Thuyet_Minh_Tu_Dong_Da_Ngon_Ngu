using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Account> Accounts { get; set; }
    public DbSet<Vendor> Vendors { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<Booth> Booths { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Narration> Narrations { get; set; }
    public DbSet<Translation> Translations { get; set; }
    public DbSet<Image> Images { get; set; }
    public DbSet<Video> Videos { get; set; }
    public DbSet<VisitLog> VisitLogs { get; set; }
    public DbSet<BoothRequestModel> BoothRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ===== ACCOUNT =====
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("ACCOUNT");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("AccountID");
            entity.Property(e => e.Username).HasColumnName("Username");
            entity.Property(e => e.PasswordHash).HasColumnName("PasswordHash");
            entity.Property(e => e.Email).HasColumnName("Email");
            entity.Property(e => e.Role).HasColumnName("Role");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.Property(e => e.IsActive).HasColumnName("Status");

            // 1-1 với Vendor: Account là principal, Vendor là dependent (giữ AccountID làm FK)
            entity.HasOne(e => e.Vendor)
                  .WithOne(v => v.Account)
                  .HasForeignKey<Vendor>(v => v.AccountId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== VENDOR =====
        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.ToTable("VENDOR");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("VendorID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CompanyName).HasColumnName("CompanyName");
            entity.Property(e => e.RepresentativeName).HasColumnName("RepresentativeName");
            entity.Property(e => e.PhoneNumber).HasColumnName("PhoneNumber");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.IsPaid).HasColumnName("IsPaid");
            entity.Property(e => e.PaidAt).HasColumnName("PaidAt");
            entity.Property(e => e.EventId).HasColumnName("EventId");
        });

        // ===== EVENT =====
        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("EVENT");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("EventID");
            entity.Property(e => e.Name).HasColumnName("EventName");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Location).HasColumnName("Location");
            entity.Property(e => e.StartDate).HasColumnName("StartDate");
            entity.Property(e => e.EndDate).HasColumnName("EndDate");
            entity.Property(e => e.LogoUrl).HasColumnName("LogoUrl");
            entity.Property(e => e.QRCodeUrl).HasColumnName("QRCodeUrl");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
        });

        // ===== BOOTH =====
        modelBuilder.Entity<Booth>(entity =>
        {
            entity.ToTable("BOOTH");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("BoothID");
            entity.Property(e => e.EventId).HasColumnName("EventID");
            entity.Property(e => e.VendorId).HasColumnName("VendorID");
            entity.Property(e => e.CategoryId).HasColumnName("CategoryID");
            entity.Property(e => e.BoothName).HasColumnName("BoothName");
            entity.Property(e => e.Description).HasColumnName("Description");
            entity.Property(e => e.Latitude).HasColumnName("Latitude").HasColumnType("decimal(10,7)");
            entity.Property(e => e.Longitude).HasColumnName("Longitude").HasColumnType("decimal(10,7)");
            entity.Property(e => e.Radius).HasColumnName("Radius").HasColumnType("decimal(10,2)");
            entity.Property(e => e.IsActive).HasColumnName("IsActive");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");

            entity.HasOne(e => e.Event)
                  .WithMany(ev => ev.Booths)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Vendor)
                  .WithMany(v => v.Booths)
                  .HasForeignKey(e => e.VendorId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Booths)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            // 1-1 với Narration: Booth là principal, Narration là dependent (BoothID là FK)
            entity.HasOne(e => e.Narration)
                  .WithOne(n => n.Booth)
                  .HasForeignKey<Narration>(n => n.BoothId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== CATEGORY =====
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("CATEGORY");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("CategoryID");
            entity.Property(e => e.Name).HasColumnName("CategoryName");
            entity.Property(e => e.Description).HasColumnName("Description");
        });

        // ===== NARRATION =====
        modelBuilder.Entity<Narration>(entity =>
        {
            entity.ToTable("NARRATION");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("NarrationID");
            entity.Property(e => e.BoothId).HasColumnName("BoothID");
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200);
            entity.Property(e => e.Content).HasColumnName("Content").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });

        // ===== TRANSLATION =====
        modelBuilder.Entity<Translation>(entity =>
        {
            entity.ToTable("TRANSLATION");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("TranslationID");
            entity.Property(e => e.NarrationId).HasColumnName("NarrationID");
            entity.Property(e => e.LanguageCode).HasColumnName("LanguageCode").IsRequired().HasMaxLength(10);
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200);
            entity.Property(e => e.Content).HasColumnName("Content").IsRequired();
            entity.Property(e => e.IsEdited).HasColumnName("IsEdited").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();

            entity.HasOne(e => e.Narration)
                  .WithMany(n => n.Translations)
                  .HasForeignKey(e => e.NarrationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== IMAGE =====
        modelBuilder.Entity<Image>(entity =>
        {
            entity.ToTable("IMAGE");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("ImageID");
            entity.Property(e => e.BoothId).HasColumnName("BoothID");
            entity.Property(e => e.FilePath).HasColumnName("FilePath").IsRequired().HasMaxLength(500);
            entity.Property(e => e.Caption).HasColumnName("Caption").HasMaxLength(200);
            entity.Property(e => e.SortOrder).HasColumnName("SortOrder").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired();

            entity.HasOne(e => e.Booth)
                  .WithMany(b => b.Images)
                  .HasForeignKey(e => e.BoothId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== VIDEO =====
        modelBuilder.Entity<Video>(entity =>
        {
            entity.ToTable("VIDEO");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("VideoID");
            entity.Property(e => e.BoothId).HasColumnName("BoothID");
            entity.Property(e => e.VideoUrl).HasColumnName("VideoUrl").IsRequired().HasMaxLength(500);
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200);
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired();

            entity.HasOne(e => e.Booth)
                  .WithMany(b => b.Videos)
                  .HasForeignKey(e => e.BoothId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== VISIT LOG =====
        modelBuilder.Entity<VisitLog>(entity =>
        {
            entity.ToTable("VISIT_LOG");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("VisitLogID");
            entity.Property(e => e.BoothId).HasColumnName("BoothID");
            entity.Property(e => e.LanguageCode).HasColumnName("LanguageCode").IsRequired().HasMaxLength(10);
            entity.Property(e => e.DeviceType).HasColumnName("DeviceType").IsRequired().HasMaxLength(20);
            entity.Property(e => e.Duration).HasColumnName("Duration").IsRequired();
            entity.Property(e => e.VisitedAt).HasColumnName("VisitedAt").IsRequired();

            entity.HasOne(e => e.Booth)
                  .WithMany(b => b.VisitLogs)
                  .HasForeignKey(e => e.BoothId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ===== BOOTH REQUEST =====
        modelBuilder.Entity<BoothRequestModel>(entity =>
        {
            entity.ToTable("BOOTH_REQUEST");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("BoothRequestID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CategoryId).HasColumnName("CategoryID");
            entity.Property(e => e.EventId).HasColumnName("EventID");
            entity.Property(e => e.BoothName).HasColumnName("BoothName").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("Description").HasMaxLength(1000);
            entity.Property(e => e.Latitude).HasColumnName("Latitude").HasColumnType("decimal(10,7)");
            entity.Property(e => e.Longitude).HasColumnName("Longitude").HasColumnType("decimal(10,7)");
            entity.Property(e => e.Radius).HasColumnName("Radius").HasColumnType("decimal(10,2)");
            entity.Property(e => e.Status).HasColumnName("Status").IsRequired().HasMaxLength(20);
            entity.Property(e => e.AdminNote).HasColumnName("AdminNote").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            entity.Property(e => e.ReviewedAt).HasColumnName("ReviewedAt");

            entity.HasOne(e => e.Account)
                  .WithMany()
                  .HasForeignKey(e => e.AccountId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Category)
                  .WithMany()
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Event)
                  .WithMany(e => e.BoothRequests)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}