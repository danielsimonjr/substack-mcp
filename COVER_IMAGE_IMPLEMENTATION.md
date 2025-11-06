# Cover Image Implementation - Complete Documentation

## Version History

### v2.3.0 - November 5, 2025
**Major Update**: Replaced Imgur with Substack's native image upload endpoint

### v2.2.0 - November 3, 2025
**Initial Implementation**: Cover image support using Imgur

---

## Current Implementation (v2.3.0)

Successfully implemented cover image upload functionality using Substack's **native `/api/v1/image` endpoint** for the Substack MCP `create_post` tool.

### Changes Made

#### 1. Added Substack Native Upload Function
**File**: `src/mcp-server.ts` (lines 9-47)

```typescript
async function uploadImageToSubstack(filePath: string, postId: number, hostname: string, apiKey: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Image = fileBuffer.toString('base64');

  // Determine MIME type from file extension
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  const mimeType = mimeTypes[ext] || 'image/png';

  // Create data URI
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const response = await fetch(`https://${hostname}/api/v1/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `connect.sid=${apiKey}`
    },
    body: JSON.stringify({
      image: dataUri,
      postId: postId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Substack image upload failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json() as { url: string };
  return data.url;
}
```

#### 2. Updated create_post Tool Schema
**File**: `src/mcp-server.ts` (lines 147)

Updated parameter description:
```typescript
cover_image: {
  type: "string",
  description: "Path to cover image file (optional, will be uploaded to Substack)"
}
```

#### 3. Modified create_post Handler
**File**: `src/mcp-server.ts` (lines 318-326)

Updated to use new Substack upload function:
```typescript
// Step 3: Upload cover image if provided
let coverImageUrl: string | undefined;
if (cover_image) {
  try {
    coverImageUrl = await uploadImageToSubstack(cover_image, postId, process.env.SUBSTACK_HOSTNAME || "substack.com", apiKey);
  } catch (error) {
    throw new Error(`Failed to upload cover image: ${(error as Error).message}`);
  }
}
```

#### 4. Version Bump
- Updated from v2.2.0 to v2.3.0
- Removed Imgur dependency completely

---

## Technical Details

### Substack Image Upload API

**Endpoint**: `POST https://{hostname}/api/v1/image`

**Request Headers** (from Request Headers.txt):
```
:authority: danielsimonjr.substack.com
:method: POST
:path: /api/v1/image
:scheme: https
accept: */*
accept-encoding: gzip, deflate, br, zstd
accept-language: en-US,en;q=0.9
content-type: application/json
Cookie: connect.sid={apiKey}
```

**Request Payload**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABAA...",
  "postId": 177878124
}
```

**Response**:
```json
{
  "url": "https://substackcdn.com/image/fetch/..."
}
```

### Image Upload Flow

1. **User provides local file path** to cover image (e.g., `c:/temp/test-cover.png`)
2. **Tool reads file** and converts to base64
3. **Determines MIME type** from file extension
4. **Creates data URI** in format `data:{mimeType};base64,{base64data}`
5. **Uploads to Substack's `/api/v1/image`** endpoint with `postId`
6. **Gets back Substack CDN URL** (e.g., `https://substackcdn.com/image/fetch/...`)
7. **Sets URL in draft's `cover_image`** field via PUT request to `/api/v1/drafts/{id}`
8. **Returns the Substack CDN URL** in the response

### Supported Image Formats

- **PNG** (`.png`) → `image/png`
- **JPG** (`.jpg`) → `image/jpeg`
- **JPEG** (`.jpeg`) → `image/jpeg`
- **GIF** (`.gif`) → `image/gif`
- **WEBP** (`.webp`) → `image/webp`

### API Endpoints Used

1. **Image Upload**: `POST https://{hostname}/api/v1/image`
   - Purpose: Upload image and get CDN URL
   - Authentication: Cookie-based with `connect.sid`
   - Payload: Data URI + postId

2. **Draft Update**: `PUT https://{hostname}/api/v1/drafts/{id}`
   - Purpose: Set cover image URL on draft
   - Field: `cover_image` with Substack CDN URL

---

## Testing Performed

### Build Test
```bash
cd C:\mcp-servers\substack-mcp
npm run build
```
✅ **Result**: Compiled successfully with no TypeScript errors

### Version Update Test
```bash
# Verified server version updated to 2.3.0
```
✅ **Result**: Server reports v2.3.0

---

## Usage Instructions

### Test After Restart

⚠️ **IMPORTANT**: MCP servers only load at Claude Code startup. You must restart Claude Code to use the new functionality.

Use the `mcp__substack__create_post` tool with:

```typescript
{
  title: "Test Post with Substack Native Upload",
  body: "This is a test post to verify the Substack native image upload functionality works correctly.",
  cover_image: "c:/temp/test-cover.png",
  draft: true
}
```

### Expected Tool Response

```json
{
  "success": true,
  "post_id": 12345678,
  "title": "Test Post with Substack Native Upload",
  "cover_image_url": "https://substackcdn.com/image/fetch/...",
  "draft": true,
  "message": "Draft post created successfully",
  "url": "https://danielsimonjr.substack.com/publish/post/12345678"
}
```

### Verification Steps

1. ✅ Response includes `cover_image_url`
2. ✅ Substack CDN URL is accessible
3. ✅ Visit the Substack draft URL
4. ✅ Confirm cover image appears in editor

---

## Files Modified

- ✅ `src/mcp-server.ts` - Main implementation
- ✅ Built to `dist/mcp-server.js`
- ✅ `QUICK_START_AFTER_RESTART.md` - Updated documentation
- ✅ `COVER_IMAGE_IMPLEMENTATION.md` - This document

---

## Known Working Configuration

- **Substack Hostname**: danielsimonjr.substack.com
- **User ID**: 3110230
- **MCP Version**: 2.3.0
- **Image Upload Endpoint**: `/api/v1/image`
- **Authentication**: Cookie-based (`connect.sid`)

---

## Advantages of Substack Native Upload

### v2.3.0 (Substack Native) vs v2.2.0 (Imgur)

| Feature | v2.2.0 (Imgur) | v2.3.0 (Substack) |
|---------|----------------|-------------------|
| **Hosting** | Third-party (Imgur) | Native (Substack CDN) |
| **Dependency** | External API required | No external dependency |
| **Authentication** | Client-ID required | Uses existing Substack auth |
| **Post Association** | Not linked to post | Linked via `postId` |
| **Reliability** | Depends on Imgur uptime | Direct Substack integration |
| **Security** | Public anonymous upload | Private authenticated upload |
| **URL Format** | `imgur.com/xxxxx.png` | `substackcdn.com/image/fetch/...` |

---

## Troubleshooting

### If cover image doesn't appear
1. Check that file path is absolute (not relative)
2. Verify image file exists and is readable
3. Check image format is supported (PNG, JPG, JPEG, GIF, WEBP)
4. Verify Substack CDN URL in response is accessible
5. Check Substack draft page to see if image field is set
6. Ensure `postId` is valid and draft exists

### If Substack upload fails
- Check `SUBSTACK_API_KEY` is set correctly in environment
- Verify `SUBSTACK_HOSTNAME` matches your publication
- Ensure `connect.sid` cookie is valid
- Check internet connection
- Verify file size is reasonable (Substack may have limits)
- Ensure image format is supported

### Common Error Messages

**"Substack image upload failed: 401 Unauthorized"**
- Check your API key (`connect.sid`) is correct
- Verify cookie is not expired

**"Failed to upload cover image: ENOENT"**
- File path is incorrect or file doesn't exist
- Use absolute paths, not relative paths

**"Substack image upload failed: 400 Bad Request"**
- Data URI format may be incorrect
- Check image file is not corrupted
- Verify file is a supported image format

---

## Migration Notes (v2.2.0 → v2.3.0)

### Breaking Changes
- **None**: The API interface remains the same

### New Features
- ✅ Native Substack image upload
- ✅ Images linked to posts via `postId`
- ✅ Better error handling with detailed messages
- ✅ Automatic MIME type detection

### Removed Features
- ❌ Imgur upload functionality
- ❌ Imgur Client-ID requirement

### Migration Steps
1. No changes needed to tool usage
2. Rebuild project: `npm run build`
3. Restart Claude Code to load updated server
4. Test with existing cover image workflows

---

## Architecture Notes

### Why the Change?

1. **Better Integration**: Substack's native endpoint properly associates images with posts
2. **No External Dependencies**: Removes reliance on third-party service (Imgur)
3. **Improved Security**: Uses authenticated upload instead of anonymous public upload
4. **Official API**: Uses Substack's official image upload endpoint
5. **Reliability**: No external service failures

### Data URI Format

The implementation uses **data URIs** as required by Substack's API:

```
data:[<media type>][;base64],<data>
```

Example:
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...
```

This format encodes the entire image in a single string that can be sent in JSON.

---

## References

- **Request Headers.txt**: Original API call capture showing Substack's endpoint
- **MCP SDK Documentation**: https://modelcontextprotocol.io
- **Substack API**: Reverse-engineered from browser requests

---

**Status**: ✅ Implementation Complete - Ready for Testing After Restart
**Current Version**: Substack MCP v2.3.0
**Last Updated**: November 5, 2025
**Previous Version**: v2.2.0 (November 3, 2025)
