# Plugin Cocos Creator MCP Server

**[📖 Tiếng Anh](README.EN.md)**  **[📖 Tiếng Việt](README.md)**

Một plugin máy chủ MCP (Model Context Protocol) toàn diện dành cho Cocos Creator 3.8+, cho phép các trợ lý AI tương tác với trình biên tập Cocos Creator thông qua một giao thức tiêu chuẩn. Cài đặt và sử dụng chỉ với một cú nhấp chuột, loại bỏ mọi môi trường và cấu hình tẻ nhạt. Đã được thử nghiệm với Claude CLI và Cursor, các trình biên tập khác về lý thuyết cũng được hỗ trợ hoàn hảo.

**🚀 Hiện cung cấp 50 công cụ mạnh mẽ, thực hiện 99% việc điều khiển trình biên tập!**

## Video Demo và Hướng dẫn

[<img width="503" height="351" alt="image" src="https://github.com/user-attachments/assets/f186ce14-9ffc-4a29-8761-48bdd7c1ea16" />](https://www.bilibili.com/video/BV1mB8dzfEw8?spm_id_from=333.788.recommend_more_video.0&vd_source=6b1ff659dd5f04a92cc6d14061e8bb92)


## Liên kết nhanh

- **[📖 Hướng dẫn tính năng đầy đủ (Tiếng Anh)](FEATURE_GUIDE_EN.md)** - Tài liệu chi tiết cho tất cả 158 công cụ (đang cập nhật)
- **[📖 Hướng dẫn tính năng đầy đủ (Tiếng Việt)](FEATURE_GUIDE_CN.md)** - Tài liệu chi tiết cho tất cả 158 công cụ (đang cập nhật)


## Nhật ký cập nhật

## 🚀 Cập nhật lớn v1.5.0 (29/07/2024) (Đã cập nhật trên Cocos Store, phiên bản GitHub sẽ được đồng bộ trong bản tiếp theo)

Cocos Store: https://store.cocos.com/app/detail/7941

- **Tinh gọn và cấu trúc lại công cụ**: Ngưng tụ hơn 150 công cụ ban đầu thành 50 công cụ cốt lõi có khả năng tái sử dụng cao và độ bao phủ lớn, loại bỏ tất cả mã dư thừa không hiệu quả, cải thiện đáng kể tính dễ sử dụng và khả năng bảo trì.
- **Thống nhất mã vận hành (Action Code)**: Tất cả các công cụ đều áp dụng mô hình "Mã vận hành + Tham số", đơn giản hóa đáng kể quy trình gọi của AI, tăng tỷ lệ gọi AI thành công, giảm số lần gọi AI và giảm 50% mức tiêu thụ token.
- **Nâng cấp toàn diện tính năng Prefab**: Sửa lỗi và hoàn thiện hoàn toàn các tính năng cốt lõi như tạo, khởi tạo, đồng bộ hóa và tham chiếu Prefab, hỗ trợ các mối quan hệ tham chiếu phức tạp, khớp 100% với định dạng chính thức.
- **Ràng buộc sự kiện và hoàn thiện tính năng cũ**: Bổ sung và thực hiện các tính năng cũ như ràng buộc sự kiện, Node/Component/Asset, v.v. Tất cả các phương thức đều hoàn toàn khớp với cách triển khai chính thức.
- **Tối ưu hóa giao diện (Interface)**: Các tham số giao diện rõ ràng hơn, tài liệu đầy đủ hơn, AI dễ hiểu và dễ gọi hơn.
- **Tối ưu hóa bảng điều khiển plugin**: UI bảng điều khiển gọn gàng hơn, thao tác trực quan hơn.
- **Nâng cao hiệu suất và khả năng tương thích**: Kiến trúc tổng thể hiệu quả hơn, tương thích với tất cả các phiên bản Cocos Creator 3.8.6 trở lên.


## Hệ thống công cụ và Mã vận hành

- Tất cả các công cụ đều được đặt tên theo dạng "Loại_Thao tác", tham số sử dụng Schema thống nhất, hỗ trợ chuyển đổi nhiều mã vận hành (action), tăng cường đáng kể tính linh hoạt và khả năng mở rộng.
- 50 công cụ cốt lõi bao phủ toàn bộ các thao tác trong trình biên tập như Scene, Node, Component, Prefab, Asset, Project, Debug, Preferences, Server, và Broadcast Message.
- Ví dụ gọi công cụ:

```json
{
  "tool": "node_lifecycle",
  "arguments": {
    "action": "create",
    "name": "MyNode",
    "parentUuid": "parent-uuid",
    "nodeType": "2DNode"
  }
}
```

---

## Các loại tính năng chính (Một số ví dụ)

- **scene_management**: Quản lý cảnh (Lấy thông tin/Mở/Lưu/Tạo mới/Đóng cảnh)
- **node_query / node_lifecycle / node_transform**: Truy vấn, tạo, xóa, thay đổi thuộc tính Node
- **component_manage / component_script / component_query**: Thêm/Xóa Component, gắn Script, thông tin Component
- **prefab_browse / prefab_lifecycle / prefab_instance**: Duyệt, tạo, khởi tạo, đồng bộ hóa Prefab
- **asset_manage / asset_analyze**: Nhập, xóa tài nguyên, phân tích phụ thuộc
- **project_manage / project_build_system**: Chạy dự án, Build, thông tin cấu hình
- **debug_console / debug_logs**: Quản lý Console và Log
- **preferences_manage**: Cài đặt tùy chỉnh (Preferences)
- **server_info**: Thông tin máy chủ
- **broadcast_message**: Quảng bá tin nhắn


### v1.4.0 - 26/07/2025 (Phiên bản GitHub hiện tại)

#### 🎯 Sửa lỗi tính năng quan trọng
- **Sửa lỗi hoàn toàn tính năng tạo Prefab**: Giải quyết triệt để vấn đề mất tham chiếu loại Component/Node/Asset khi tạo Prefab.
- **Xử lý tham chiếu đúng đắn**: Triển khai định dạng tham chiếu hoàn toàn khớp với việc tạo Prefab thủ công.
  - **Tham chiếu nội bộ**: Tham chiếu Node và Component bên trong Prefab được chuyển đổi chính xác sang định dạng `{"__id__": x}`.
  - **Tham chiếu bên ngoài**: Tham chiếu Node và Component bên ngoài Prefab được đặt chính xác thành `null`.
  - **Tham chiếu tài nguyên**: Tham chiếu các tài nguyên như Prefab, Texture, SpriteFrame, v.v., giữ nguyên định dạng UUID.
- **Chuẩn hóa API gỡ bỏ Component/Script**: Khi gỡ bỏ Component/Script, hiện tại bắt buộc phải truyền vào `cid` của Component (trường `type`), không được sử dụng tên script hoặc tên lớp. AI và người dùng nên sử dụng `getComponents` để lấy trường `type` (cid) trước, sau đó truyền vào `removeComponent`. Điều này đảm bảo gỡ bỏ chính xác 100% tất cả các loại Component và Script, tương thích với mọi phiên bản Cocos Creator.

#### 🔧 Các cải tiến cốt lõi
- **Tối ưu hóa thứ tự chỉ mục**: Điều chỉnh thứ tự tạo đối tượng Prefab để đảm bảo nhất quán với định dạng tiêu chuẩn của Cocos Creator.
- **Hỗ trợ loại Component**: Mở rộng khả năng phát hiện tham chiếu Component, hỗ trợ tất cả các loại Component bắt đầu bằng `cc.` (Label, Button, Sprite, v.v.).
- **Cơ chế ánh xạ UUID**: Hoàn thiện hệ thống ánh xạ từ UUID nội bộ sang chỉ mục, đảm bảo các mối quan hệ tham chiếu được thiết lập chính xác.
- **Tiêu chuẩn hóa định dạng thuộc tính**: Sửa lỗi thứ tự và định dạng thuộc tính của Component, loại bỏ các lỗi phân tích cú pháp của Engine.

#### 🐛 Sửa lỗi (Bug Fixes)
- **Sửa lỗi nhập Prefab**: Giải quyết lỗi `Cannot read properties of undefined (reading '_name')`.
- **Sửa lỗi tương thích Engine**: Giải quyết lỗi `placeHolder.initDefault is not a function`.
- **Sửa lỗi ghi đè thuộc tính**: Ngăn chặn các thuộc tính quan trọng như `_objFlags` bị dữ liệu Component ghi đè.
- **Sửa lỗi mất tham chiếu**: Đảm bảo tất cả các loại tham chiếu đều có thể được lưu và tải chính xác.

#### 📈 Tăng cường tính năng
- **Giữ lại đầy đủ thuộc tính Component**: Bao gồm cả các thuộc tính riêng tư (như `_group`, `_density`, v.v.) của tất cả các Component.
- **Hỗ trợ cấu trúc Node con**: Xử lý chính xác cấu trúc phân cấp và quan hệ Node con của Prefab.
- **Xử lý thuộc tính Transform**: Giữ lại vị trí, xoay, tỷ lệ và thông tin phân cấp của Node.
- **Tối ưu hóa thông tin Debug**: Thêm nhật ký xử lý tham chiếu chi tiết để dễ dàng theo dõi vấn đề.

#### 💡 Đột phá kỹ thuật
- **Nhận diện loại tham chiếu**: Phân biệt thông minh giữa tham chiếu nội bộ và bên ngoài, tránh các tham chiếu không hợp lệ.
- **Tương thích định dạng**: Prefab tạo ra tương thích 100% với định dạng của Prefab được tạo thủ công.
- **Tích hợp Engine**: Prefab có thể được gắn vào Scene một cách bình thường mà không có bất kỳ lỗi runtime nào.
- **Tối ưu hóa hiệu suất**: Tối ưu hóa quy trình tạo Prefab, nâng cao hiệu quả xử lý các Prefab lớn.

**🎉 Giờ đây tính năng tạo Prefab đã hoàn toàn khả dụng, hỗ trợ các quan hệ tham chiếu Component phức tạp và cấu trúc Prefab đầy đủ!**

### v1.3.0 - 25/07/2024

#### 🆕 Tính năng mới
- **Tích hợp bảng quản lý công cụ**: Thêm tính năng quản lý công cụ toàn diện trực tiếp trong bảng điều khiển chính.
- **Hệ thống cấu hình công cụ**: Thực hiện bật/tắt công cụ có chọn lọc, hỗ trợ lưu cấu hình lâu dài.
- **Tải công cụ động**: Tăng cường tính năng khám phá công cụ, có thể tải động tất cả 158 công cụ khả dụng trong máy chủ MCP.
- **Quản lý trạng thái công cụ thời gian thực**: Thêm cập nhật thời gian thực cho số lượng và trạng thái công cụ, phản ánh ngay lập tức khi một công cụ được chuyển đổi.
- **Lưu trữ cấu hình**: Tự động lưu và tải cấu hình công cụ giữa các phiên làm việc của trình biên tập.

#### 🔧 Cải tiến
- **Thống nhất giao diện bảng điều khiển**: Gộp quản lý công cụ vào bảng điều khiển máy chủ MCP chính dưới dạng tab, loại bỏ nhu cầu về các bảng điều khiển riêng biệt.
- **Tăng cường cài đặt máy chủ**: Cải thiện quản lý cấu hình máy chủ với tính năng lưu trữ và tải tốt hơn.
- **Tích hợp Vue 3**: Nâng cấp lên Vue 3 Composition API, cung cấp khả năng phản hồi và hiệu suất tốt hơn.
- **Xử lý lỗi tốt hơn**: Thêm xử lý lỗi toàn diện, bao gồm cơ chế hoàn tác cho các thao tác thất bại.
- **Cải thiện UI/UX**: Tăng cường thiết kế hình ảnh, bao gồm các dải phân cách thích hợp, phong cách khối độc đáo và nền modal không trong suốt.

#### 🐛 Sửa lỗi
- **Sửa lỗi lưu trữ trạng thái công cụ**: Giải quyết vấn đề trạng thái công cụ bị reset khi chuyển đổi tab hoặc mở lại bảng điều khiển.
- **Sửa lỗi tải cấu hình**: Khắc phục các vấn đề tải cài đặt máy chủ và đăng ký tin nhắn.
- **Sửa lỗi tương tác checkbox**: Giải quyết vấn đề bỏ chọn checkbox và cải thiện khả năng phản hồi.
- **Sửa lỗi cuộn bảng điều khiển**: Đảm bảo chức năng cuộn chính xác trong bảng quản lý công cụ.
- **Sửa lỗi giao tiếp IPC**: Giải quyết các vấn đề giao tiếp IPC khác nhau giữa Frontend và Backend.

#### 🏗️ Cải tiến kỹ thuật
- **Đơn giản hóa kiến trúc**: Loại bỏ sự phức tạp của đa cấu hình, tập trung vào quản lý cấu hình đơn nhất.
- **An toàn kiểu dữ liệu tốt hơn**: Tăng cường định nghĩa kiểu TypeScript và giao diện (Interface).
- **Cải thiện đồng bộ dữ liệu**: Đồng bộ tốt hơn giữa trạng thái UI Frontend và trình quản lý công cụ Backend.
- **Tăng cường Debug**: Thêm tính năng ghi nhật ký và gỡ lỗi toàn diện.

#### 📊 Thông số thống kê
- **Tổng số công cụ**: Tăng từ 151 lên 158 công cụ.
- **Danh mục**: 13 danh mục công cụ, bao phủ toàn diện.
- **Điều khiển trình biên tập**: Thực hiện bao phủ 98% tính năng của trình biên tập.

### v1.2.0 - Các phiên bản trước
- Phát hành lần đầu, bao gồm 151 công cụ.
- Các tính năng máy chủ MCP cơ bản.
- Các thao tác với Scene, Node, Component và Prefab.
- Điều khiển Project và các công cụ Debug.



## Sử dụng nhanh

**Cấu hình Claude Desktop:**

Hiện tại, Plugin đã hỗ trợ **Giao thức Stdio trực tiếp** thông qua một Bridge tích hợp sẵn. Bạn không cần cài đặt thêm script ngoài.

**Cách 1: Sử dụng lệnh `cocos-mcp` (Khuyên dùng)**
1. Mở terminal tại thư mục `extensions/cocos-mcp-server`.
2. Chạy lệnh: 
   ```powershell
   npm run build
   npm link
   ```
3. Thêm cấu hình này vào file `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cocos": {
      "command": "cocos-mcp"
    }
  }
}
```

**Cách 2: Sử dụng đường dẫn trực tiếp (Ổn định nhất trên Windows)**
Nếu `npm link` gặp lỗi, hãy sử dụng đường dẫn tuyệt đối tới tệp `main.js`:

```json
{
  "mcpServers": {
    "cocos": {
      "command": "node",
      "args": [
        "C:\\Đường\\Dẫn\\Đến\\extensions\\cocos-mcp-server\\dist\\main.js"
      ]
    }
  }
}
```
*(Lưu ý: Đảm bảo sử dụng dấu xuyệt kép `\\` và thay đổi đường dẫn cho đúng với máy của bạn)*

Bản cập nhật mới nhất đã chuyển sang sử dụng **TCP/Readline** thay vì HTTP thuần túy để tăng hiệu suất và độ ổn định. Cursor vẫn có thể kết nối thông qua Bridge nếu cần, nhưng khuyên dùng Stdio (trực tiếp qua lệnh hoặc node).

## Các tính năng

### 🎯 Thao tác Scene (scene_*)
- **scene_management**: Quản lý Scene - Lấy Scene hiện tại, mở/lưu/tạo/đóng Scene, hỗ trợ truy vấn danh sách Scene.
- **scene_hierarchy**: Phân cấp Scene - Lấy cấu trúc Scene đầy đủ, hỗ trợ bao gồm thông tin Component.
- **scene_execution_control**: Điều khiển thực thi - Thực thi các phương thức Component, script Scene, đồng bộ hóa Prefab.

### 🎮 Thao tác Node (node_*)
- **node_query**: Truy vấn Node - Tìm kiếm Node theo tên/mô hình, lấy thông tin Node, phát hiện loại 2D/3D.
- **node_lifecycle**: Vòng đời Node - Tạo/Xóa Node, hỗ trợ cài đặt trước Component, khởi tạo Prefab.
- **node_transform**: Biến đổi Node - Thay đổi tên, vị trí, xoay, tỷ lệ, khả năng hiển thị và các thuộc tính khác của Node.
- **node_hierarchy**: Phân cấp Node - Di chuyển, sao chép, dán Node, hỗ trợ các thao tác cấu trúc phân cấp.
- **node_clipboard**: Clipboard Node - Các thao tác Sao chép/Dán/Cắt Node.
- **node_property_management**: Quản lý thuộc tính - Reset thuộc tính Node, thuộc tính Component, thuộc tính biến đổi.

### 🔧 Thao tác Component (component_*)
- **component_manage**: Quản lý Component - Thêm/Xóa các Component của Engine (cc.Sprite, cc.Button, v.v.).
- **component_script**: Component Script - Gắn/Gỡ các Component script tùy chỉnh.
- **component_query**: Truy vấn Component - Lấy danh sách Component, thông tin chi tiết, các loại Component khả dụng.
- **set_component_property**: Cài đặt thuộc tính - Cài đặt giá trị cho một hoặc nhiều thuộc tính của Component.

### 📦 Thao tác Prefab (prefab_*)
- **prefab_browse**: Duyệt Prefab - Liệt kê Prefab, xem thông tin, xác thực file.
- **prefab_lifecycle**: Vòng đời Prefab - Tạo Prefab từ Node, xóa Prefab.
- **prefab_instance**: Thực thể Prefab (Instance) - Khởi tạo vào Scene, hủy liên kết (unlink), áp dụng thay đổi (apply), hoàn tác về ban đầu (revert).
- **prefab_edit**: Chỉnh sửa Prefab - Vào/Thoát chế độ chỉnh sửa, lưu Prefab, kiểm tra thay đổi.

### 🚀 Điều khiển Project (project_*)
- **project_manage**: Quản lý Project - Chạy dự án, Build dự án, lấy thông tin và cài đặt dự án.
- **project_build_system**: Hệ thống Build - Điều khiển bảng Build, kiểm tra trạng thái Build, quản lý máy chủ Preview.

### 🔍 Công cụ Debug (debug_*)
- **debug_console**: Quản lý Console - Lấy/Xóa log Console, hỗ trợ lọc và giới hạn.
- **debug_logs**: Phân tích Log - Đọc/Tìm kiếm/Phân tích các file log dự án, hỗ trợ khớp mẫu (pattern matching).
- **debug_system**: Debug hệ thống - Lấy thông tin trình biên tập, thống kê hiệu suất, thông tin môi trường.

### 📁 Quản lý tài nguyên (asset_*)
- **asset_manage**: Quản lý tài nguyên - Nhập/Xóa tài nguyên hàng loạt, lưu metadata, tạo URL.
- **asset_analyze**: Phân tích tài nguyên - Lấy quan hệ phụ thuộc, xuất danh sách tài nguyên.
- **asset_system**: Hệ thống tài nguyên - Làm mới tài nguyên, truy vấn trạng thái cơ sở dữ liệu tài nguyên.
- **asset_query**: Truy vấn tài nguyên - Truy vấn tài nguyên theo loại/thư mục, lấy thông tin chi tiết.
- **asset_operations**: Thao tác tài nguyên - Tạo/Sao chép/Di chuyển/Xóa/Lưu/Nhập lại tài nguyên.

### ⚙️ Cài đặt tùy chỉnh (preferences_*)
- **preferences_manage**: Quản lý Preferences - Lấy/Cài đặt các Preferences của trình biên tập.
- **preferences_global**: Cài đặt toàn cục - Quản lý cấu hình toàn cục và cài đặt hệ thống.

### 🌐 Máy chủ và Quảng bá (server_* / broadcast_*)
- **server_info**: Thông tin máy chủ - Lấy trạng thái máy chủ, chi tiết dự án, thông tin môi trường.
- **broadcast_message**: Quảng bá tin nhắn - Lắng nghe và quảng bá các tin nhắn tùy chỉnh.

### 🖼️ Hình ảnh tham chiếu (referenceImage_*)
- **reference_image_manage**: Quản lý hình ảnh tham chiếu - Thêm/Xóa/Quản lý hình ảnh tham chiếu trong Scene View.
- **reference_image_view**: Chế độ xem hình ảnh tham chiếu - Điều khiển hiển thị và chỉnh sửa hình ảnh tham chiếu.

### 🎨 Scene View (sceneView_*)
- **scene_view_control**: Điều khiển Scene View - Điều khiển công cụ Gizmo, hệ tọa độ, chế độ xem.
- **scene_view_tools**: Công cụ Scene View - Quản lý các công cụ và tùy chọn khác nhau của Scene View.

### ✅ Công cụ xác thực (validation_*)
- **validation_scene**: Xác thực Scene - Xác thực tính toàn vẹn của Scene, kiểm tra tài nguyên bị thiếu.
- **validation_asset**: Xác thực tài nguyên - Xác thực tham chiếu tài nguyên, kiểm tra tính toàn vẹn của tài nguyên.

### 🛠️ Quản lý công cụ
- **Hệ thống cấu hình công cụ**: Bật/Tắt công cụ có chọn lọc, hỗ trợ nhiều bộ cấu hình.
- **Lưu trữ cấu hình**: Tự động lưu và tải cấu hình công cụ.
- **Nhập/Xuất cấu hình**: Hỗ trợ tính năng nhập và xuất cấu hình công cụ.
- **Quản lý trạng thái thời gian thực**: Cập nhật và đồng bộ hóa trạng thái công cụ thời gian thực.

### 🚀 Ưu thế cốt lõi
- **Thống nhất mã vận hành**: Tất cả các công cụ được đặt tên theo dạng "Loại_Thao tác", Schema tham số thống nhất.
- **Khả năng tái sử dụng cao**: 50 công cụ cốt lõi bao phủ 99% tính năng trình biên tập.
- **Thân thiện với AI**: Tham số rõ ràng, tài liệu đầy đủ, gọi lệnh đơn giản.
- **Tối ưu hóa hiệu suất**: Giảm 50% mức tiêu thụ token, tăng tỷ lệ gọi AI thành công.
- **Tương thích hoàn toàn**: Khớp 100% với API chính thức của Cocos Creator.

## Hướng dẫn cài đặt

### 1. Sao chép thư mục plugin

Sao chép toàn bộ thư mục `cocos-mcp-server` vào thư mục `extensions` trong dự án Cocos Creator của bạn. Bạn cũng có thể nhập dự án trực tiếp thông qua trình quản lý mở rộng (Extension Manager):

```
Dự án của bạn/
├── assets/
├── extensions/
│   └── cocos-mcp-server/          <- Đặt plugin ở đây
│       ├── source/
│       ├── dist/
│       ├── package.json
│       └── ...
├── settings/
└── ...
```

### 2. Cài đặt phụ thuộc (Dependencies)

```bash
cd extensions/cocos-mcp-server
npm install
```

### 3. Build plugin

```bash
npm run build
```

### 4. Bật plugin

1. Khởi động lại Cocos Creator hoặc làm mới các extension.
2. Plugin sẽ xuất hiện trong menu Extension.
3. Nhấp vào `Extension > Cocos MCP Server` để mở bảng điều khiển.

## Cách sử dụng

### Khởi động máy chủ

1. Mở bảng điều khiển MCP Server từ `Extension > Cocos MCP Server`.
2. Cấu hình cài đặt:
   - **Cổng (Port)**: Cổng máy chủ TCP (mặc định: 3000).
   - **Tự động khởi động (Auto Start)**: Tự động khởi động máy chủ khi trình biên tập khởi động.
   - **Log Debug**: Bật nhật ký chi tiết để phục vụ phát triển và gỡ lỗi.
   - **Số kết nối tối đa (Max Connections)**: Số lượng kết nối đồng thời tối đa được phép.

3. Nhấp vào "Khởi động máy chủ" để bắt đầu chấp nhận kết nối từ Bridge.

### Kết nối với Trợ lý AI

Máy chủ cung cấp một đầu cuối HTTP tại `http://localhost:3000/mcp` (hoặc cổng bạn đã cấu hình).

Trợ lý AI có thể sử dụng giao thức MCP để kết nối và truy cập tất cả các công cụ khả dụng.


## Phát triển

### Cấu trúc dự án
```
cocos-mcp-server/
├── source/                    # File nguồn TypeScript
│   ├── main.ts               # Điểm vào (entry point) của plugin
│   ├── mcp-server.ts         # Triển khai máy chủ MCP
│   ├── settings.ts           # Quản lý cài đặt
│   ├── types/                # Định nghĩa kiểu TypeScript
│   ├── tools/                # Triển khai các công cụ
│   │   ├── scene-tools.ts
│   │   ├── node-tools.ts
│   │   ├── component-tools.ts
│   │   ├── prefab-tools.ts
│   │   ├── project-tools.ts
│   │   ├── debug-tools.ts
│   │   ├── preferences-tools.ts
│   │   ├── server-tools.ts
│   │   ├── broadcast-tools.ts
│   │   ├── scene-advanced-tools.ts (Đã gộp vào node-tools.ts và scene-tools.ts)
│   │   ├── scene-view-tools.ts
│   │   ├── reference-image-tools.ts
│   │   └── asset-advanced-tools.ts
│   ├── panels/               # Triển khai các bảng UI
│   └── test/                 # Các file test
├── dist/                     # Đầu ra JavaScript sau khi biên dịch
├── static/                   # Tài nguyên tĩnh (icon, v.v.)
├── i18n/                     # Các file quốc tế hóa
├── package.json              # Cấu hình plugin
└── tsconfig.json             # Cấu hình TypeScript
```

### Build từ mã nguồn

```bash
# Cài đặt phụ thuộc
npm install

# Build phát triển (chế độ watch)
npm run watch

# Build chính thức
npm run build
```

### Thêm công cụ mới

1. Tạo lớp công cụ mới trong `source/tools/`.
2. Thực hiện interface `ToolExecutor`.
3. Thêm công cụ vào phần khởi tạo trong `mcp-server.ts`.
4. Công cụ sẽ tự động được hiển thị thông qua giao thức MCP.

### Hỗ trợ TypeScript

Plugin được viết hoàn toàn bằng TypeScript, với:
- Bật kiểm tra kiểu nghiêm ngặt (strict type checking).
- Cung cấp định nghĩa kiểu đầy đủ cho tất cả các API.
- Hỗ trợ IntelliSense trong quá trình phát triển.
- Tự động biên dịch sang JavaScript.

## Khắc phục sự cố

### Các vấn đề thường gặp

1. **Máy chủ không khởi động được**: Kiểm tra xem cổng có sẵn không và kiểm tra cài đặt tường lửa.
2. **Công cụ không hoạt động**: Đảm bảo Scene đã được tải và UUID là hợp lệ.
3. **Lỗi Build**: Chạy `npm run build` để kiểm tra các lỗi TypeScript.
4. **Vấn đề kết nối**: Xác nhận lại URL HTTP và trạng thái máy chủ.

### Chế độ Debug

Bật Log Debug trong bảng điều khiển plugin để nhận nhật ký thao tác chi tiết.

### Sử dụng các công cụ Debug

```json
{
  "tool": "debug_get_console_logs",
  "arguments": {"limit": 50, "filter": "error"}
}
```

```json
{
  "tool": "debug_validate_scene",
  "arguments": {"checkMissingAssets": true}
}
```

## Yêu cầu hệ thống

- Cocos Creator 3.8.6 trở lên.
- Node.js (đi kèm với Cocos Creator).
- TypeScript (được cài đặt như một phụ thuộc phát triển).

## Bản quyền (License)

Plugin này được cung cấp cho các dự án Cocos Creator sử dụng, và mã nguồn được đóng gói cùng nhau, có thể dùng để học tập và trao đổi. Không mã hóa. Hỗ trợ bạn tự phát triển và tối ưu hóa thêm. Mọi mã nguồn của dự án này hoặc mã nguồn phái sinh đều không được sử dụng cho bất kỳ mục đích thương mại hoặc bán lại nào. Nếu cần sử dụng cho mục đích thương mại, vui lòng liên hệ với tôi.

## Liên hệ với tôi để gia nhập nhóm
<img alt="image" src="https://github.com/user-attachments/assets/a276682c-4586-480c-90e5-6db132e89e0f" width="400" height="400" />
