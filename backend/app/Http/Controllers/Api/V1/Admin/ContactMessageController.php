<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateContactMessageRequest;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use App\Services\ContactMessageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ContactMessageController extends Controller
{
    public function __construct(private readonly ContactMessageService $messages) {}

    /** GET /api/v1/admin/messages?filter=inbox|unread|archived|all&page=2 */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filter = in_array($request->query('filter'), ContactMessageService::FILTERS, true)
            ? $request->query('filter')
            : 'inbox';

        return ContactMessageResource::collection($this->messages->list($filter))
            ->additional(['meta' => ['unread_count' => $this->messages->unreadCount()]]);
    }

    /** GET /api/v1/admin/messages/{id} — marque le message comme lu */
    public function show(ContactMessage $contactMessage): ContactMessageResource
    {
        return ContactMessageResource::make($this->messages->open($contactMessage));
    }

    /** PATCH /api/v1/admin/messages/{id}  { "read": false } ou { "archived": true } */
    public function update(UpdateContactMessageRequest $request, ContactMessage $contactMessage): ContactMessageResource
    {
        return ContactMessageResource::make($this->messages->update($contactMessage, $request->validated()));
    }

    public function destroy(ContactMessage $contactMessage): Response
    {
        $this->messages->delete($contactMessage);

        return response()->noContent();
    }
}
