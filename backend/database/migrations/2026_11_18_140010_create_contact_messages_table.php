<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 255);
            $table->string('subject', 200);
            $table->text('body');
            $table->timestamp('read_at')->nullable()->index(); // null = non lu
            $table->timestamp('archived_at')->nullable();
            $table->ipAddress()->nullable();                    // type inet sous PostgreSQL
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
