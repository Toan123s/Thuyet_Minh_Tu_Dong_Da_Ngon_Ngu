using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Account>          Accounts      { get; set; }
    public DbSet<Vendor>           Vendors       { get; set; }
    public DbSet<Event>            Events        { get; set; }
    public DbSet<Booth>            Booths        { get; set; }
    public DbSet<Category>         Categories    { get; set; }
    public DbSet<Narration>        Narrations    { get; set; }
    public DbSet<Translation>      Translations  { get; set; }
    public DbSet<Image>            Images        { get; set; }
    public DbSet<Video>            Videos        { get; set; }
    public DbSet<VisitLog>         VisitLogs     { get; set; }
    public DbSet<CategoryTranslation> CategoryTranslations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── ACCOUNT ─────────────────────────────────────────────────
        modelBuilder.Entity<Account>(e =>
        {
            e.ToTable("ACCOUNT");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("AccountID");
            e.Property(x => x.Username).HasColumnName("Username");
            e.Property(x => x.PasswordHash).HasColumnName("PasswordHash");
            e.Property(x => x.Email).HasColumnName("Email");
            e.Property(x => x.Role).HasColumnName("Role");
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt");
            e.Property(x => x.IsActive).HasColumnName("Status");

            e.HasOne(x => x.Vendor)
             .WithOne(v => v.Account)
             .HasForeignKey<Vendor>(v => v.AccountId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── VENDOR ──────────────────────────────────────────────────
        modelBuilder.Entity<Vendor>(e =>
        {
            e.ToTable("VENDOR");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("VendorID");
            e.Property(x => x.AccountId).HasColumnName("AccountID");
            e.Property(x => x.CompanyName).HasColumnName("CompanyName");
            e.Property(x => x.RepresentativeName).HasColumnName("RepresentativeName");
            e.Property(x => x.PhoneNumber).HasColumnName("PhoneNumber");
            e.Property(x => x.Description).HasColumnName("Description");
            e.Property(x => x.IsPaid).HasColumnName("IsPaid");
            e.Property(x => x.PaidAt).HasColumnName("PaidAt");
            e.Property(x => x.EventId).HasColumnName("EventId");
        });

        // ── EVENT ───────────────────────────────────────────────────
        modelBuilder.Entity<Event>(e =>
        {
            e.ToTable("EVENT");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("EventID");
            e.Property(x => x.Name).HasColumnName("EventName");
            e.Property(x => x.Description).HasColumnName("Description");
            e.Property(x => x.Location).HasColumnName("Location");
            e.Property(x => x.StartDate).HasColumnName("StartDate");
            e.Property(x => x.EndDate).HasColumnName("EndDate");
            e.Property(x => x.LogoUrl).HasColumnName("LogoUrl");
            e.Property(x => x.QRCodeUrl).HasColumnName("QRCodeUrl");
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt");
        });

        // ── BOOTH ───────────────────────────────────────────────────
        modelBuilder.Entity<Booth>(e =>
        {
            e.ToTable("BOOTH");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("BoothID");
            e.Property(x => x.EventId).HasColumnName("EventID");
            e.Property(x => x.VendorId).HasColumnName("VendorID");
            e.Property(x => x.CategoryId).HasColumnName("CategoryID");
            e.Property(x => x.BoothName).HasColumnName("BoothName");
            e.Property(x => x.Description).HasColumnName("Description");
            e.Property(x => x.Latitude).HasColumnName("Latitude").HasColumnType("decimal(10,7)");
            e.Property(x => x.Longitude).HasColumnName("Longitude").HasColumnType("decimal(10,7)");
            e.Property(x => x.Radius).HasColumnName("Radius").HasColumnType("decimal(10,2)");
            e.Property(x => x.IsActive).HasColumnName("IsActive");
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt");

            e.HasOne(x => x.Event)
             .WithMany(ev => ev.Booths)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Vendor)
             .WithMany(v => v.Booths)
             .HasForeignKey(x => x.VendorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Category)
             .WithMany(c => c.Booths)
             .HasForeignKey(x => x.CategoryId)
             .OnDelete(DeleteBehavior.SetNull);

            // 1-1 Booth ↔ Narration
            e.HasOne(x => x.Narration)
             .WithOne(n => n.Booth)
             .HasForeignKey<Narration>(n => n.BoothId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── CATEGORY ────────────────────────────────────────────────
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("CATEGORY");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("CategoryID");
            e.Property(x => x.Name).HasColumnName("CategoryName");
            e.Property(x => x.Description).HasColumnName("Description");
        });

        // ── CATEGORY TRANSLATION ──────────────────────────────────────
        // Cache bản dịch tên category (vd "Di tích - Lịch sử") theo ngôn ngữ.
        // vi không lưu (luôn trả nguyên văn) — chỉ lưu các ngôn ngữ khác.
        modelBuilder.Entity<CategoryTranslation>(e =>
        {
            e.ToTable("CATEGORY_TRANSLATION");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("CategoryTranslationID");
            e.Property(x => x.CategoryId).HasColumnName("CategoryID");
            e.Property(x => x.LanguageCode).HasColumnName("LanguageCode").IsRequired().HasMaxLength(10);
            e.Property(x => x.Name).HasColumnName("Name").IsRequired().HasMaxLength(200);
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();

            e.HasIndex(x => new { x.CategoryId, x.LanguageCode }).IsUnique();

            e.HasOne(x => x.Category)
             .WithMany()
             .HasForeignKey(x => x.CategoryId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── NARRATION ───────────────────────────────────────────────
        modelBuilder.Entity<Narration>(e =>
        {
            e.ToTable("NARRATION");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("NarrationID");
            e.Property(x => x.BoothId).HasColumnName("BoothID");
            e.Property(x => x.Title).HasColumnName("Title").HasMaxLength(200);
            e.Property(x => x.Content).HasColumnName("Content").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();
        });

        // ── TRANSLATION ─────────────────────────────────────────────
        modelBuilder.Entity<Translation>(e =>
        {
            e.ToTable("TRANSLATION");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("TranslationID");
            e.Property(x => x.NarrationId).HasColumnName("NarrationID");
            e.Property(x => x.LanguageCode).HasColumnName("LanguageCode").IsRequired().HasMaxLength(10);
            e.Property(x => x.Title).HasColumnName("Title").HasMaxLength(200);
            e.Property(x => x.Content).HasColumnName("Content").IsRequired();
            e.Property(x => x.IsEdited).HasColumnName("IsEdited").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            e.Property(x => x.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();

            e.HasOne(x => x.Narration)
             .WithMany(n => n.Translations)
             .HasForeignKey(x => x.NarrationId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── IMAGE ───────────────────────────────────────────────────
        modelBuilder.Entity<Image>(e =>
        {
            e.ToTable("IMAGE");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("ImageID");
            e.Property(x => x.BoothId).HasColumnName("BoothID");
            e.Property(x => x.FilePath).HasColumnName("FilePath").IsRequired().HasMaxLength(500);
            e.Property(x => x.Caption).HasColumnName("Caption").HasMaxLength(200);
            e.Property(x => x.SortOrder).HasColumnName("SortOrder").IsRequired();
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt").IsRequired();

            e.HasOne(x => x.Booth)
             .WithMany(b => b.Images)
             .HasForeignKey(x => x.BoothId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── VIDEO ───────────────────────────────────────────────────
        modelBuilder.Entity<Video>(e =>
        {
            e.ToTable("VIDEO");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("VideoID");
            e.Property(x => x.BoothId).HasColumnName("BoothID");
            e.Property(x => x.VideoUrl).HasColumnName("VideoUrl").IsRequired().HasMaxLength(500);
            e.Property(x => x.Title).HasColumnName("Title").HasMaxLength(200);
            e.Property(x => x.CreatedAt).HasColumnName("CreatedAt").IsRequired();

            e.HasOne(x => x.Booth)
             .WithMany(b => b.Videos)
             .HasForeignKey(x => x.BoothId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── VISIT LOG ───────────────────────────────────────────────
        modelBuilder.Entity<VisitLog>(e =>
        {
            e.ToTable("VISIT_LOG");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("VisitLogID");
            e.Property(x => x.BoothId).HasColumnName("BoothID");
            e.Property(x => x.LanguageCode).HasColumnName("LanguageCode").IsRequired().HasMaxLength(10);
            e.Property(x => x.DeviceType).HasColumnName("DeviceType").IsRequired().HasMaxLength(20);
            e.Property(x => x.Duration).HasColumnName("Duration").IsRequired();
            e.Property(x => x.VisitedAt).HasColumnName("VisitedAt").IsRequired();

            e.HasOne(x => x.Booth)
             .WithMany(b => b.VisitLogs)
             .HasForeignKey(x => x.BoothId)
             .OnDelete(DeleteBehavior.Cascade);
        });

    }
}