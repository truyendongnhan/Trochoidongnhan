import { World } from '../types';

export const WORLDS: Record<string, World> = {
  'one-piece': {
    id: 'one-piece',
    name: 'Kỷ Nguyên Hải Tặc (One Piece)',
    type: 'anime',
    description: 'Thời đại Đại Hải Tặc nơi vô số những kẻ nuôi mộng xưng bá đang vươn buồm tiến ra Đại Trình Tuyến (Grand Line) để tìm kiếm kho báu vĩ đại nhất: One Piece.',
    settingDetails: 'Thế giới bao gồm 4 vùng biển lớn (Đông, Tây, Nam, Bắc Blue) và một dải biển nguy hiểm ở giữa gọi là Grand Line (Đại Trình Tuyến), bị chia cắt bởi lục địa Red Line. Một thế giới bị thống trị bởi biển cả, nơi những hòn đảo sở hữu hệ sinh thái và nền văn hoá kỳ lạ. Xung đột triền miên xảy ra giữa Hải Quân đại diện cho Chính Quyền Thế Giới và những Hải Tặc tự do ngoài vòng pháp luật. Tại đây, Trái Ác Quỷ (Devil Fruit) là báu vật đại dương ban cho người ăn những siêu năng lực kỳ bí nhưng lại chịu lời nguyền bị biển cả ruồng bỏ. Ngoài ra, Haki - sức mạnh của ý chí - là chìa khoá để chạm tới đỉnh cao.',
    majorFactions: ['Chính Phủ Thế Giới & Hải Quân', 'Tứ Hoàng', 'Thất Vũ Hải', 'Quân Cách Mạng', 'Thợ Săn Tiền Thưởng'],
    image: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=1000',
    powerSystem: 'Haki / Trái Ác Quỷ / Lục Thức',
    currencyName: 'Beli',
    baseStats: ['Thể lực', 'Tốc độ', 'Haki Vũ Trang', 'Haki Quan Sát', 'Haki Bá Vương'],
    backgrounds: [
      { name: 'Hải Tặc Tân Binh', rarity: 'Common' },
      { name: 'Thợ Săn Tiền Thưởng', rarity: 'Common' },
      { name: 'Lính Hải Quân', rarity: 'Common' },
      { name: 'Quý Tộc Sa Sút', rarity: 'Rare' },
      { name: 'Dòng Máu Cự Nhân', rarity: 'Rare' },
      { name: 'Người Sống Sót Ohara', rarity: 'Epic' },
      { name: 'Thiên Quân Tộc (Skypiea)', rarity: 'Epic' },
      { name: 'Hậu Duệ D.', rarity: 'Legendary' }
    ],
    powers: [
      { name: 'Khí Tu Thể Thuật Cơ Bản', rarity: 'Common' },
      { name: 'Kỹ Năng Xạ Thủ / Pháo Thủ', rarity: 'Common' },
      { name: 'Hệ Thống Lục Thức (Rokushiki)', rarity: 'Rare' },
      { name: 'Haki Vũ Trang / Haki Quan Sát (Bản Sơ Khai)', rarity: 'Rare' },
      { name: 'Trái Ác Quỷ Hệ Zoan Trâu Bò (Động vật thường)', rarity: 'Rare' },
      { name: 'Trái Ác Quỷ Hệ Paramecia (Siêu nhân)', rarity: 'Epic' },
      { name: 'Trái Ác Quỷ Hệ Zoan Cổ Đại / Thần Thoại', rarity: 'Legendary' },
      { name: 'Trái Ác Quỷ Hệ Logia (Tự nhiên)', rarity: 'Legendary' },
      { name: 'Haki Bá Vương Bẩm Sinh', rarity: 'Legendary' }
    ]
  },
  'naruto': {
    id: 'naruto',
    name: 'Thế Giới Nhẫn Giả (Naruto)',
    type: 'anime',
    description: 'Hành trình của những Nhẫn giả (Ninja) sử dụng Chakra để thi triển nhẫn thuật. Bóng tối của chiến tranh và khát vọng hoà bình len lỏi qua các thời kỳ.',
    settingDetails: 'Thế giới được chia thành nhiều quốc gia lớn nhỏ, mỗi quốc gia mượn sức mạnh quân sự từ những Làng Nhẫn Giả ẩn khuất. Ngũ Đại Cường Quốc tương ứng với 5 ngôi làng mạnh nhất: Konoha (Lá), Suna (Cát), Kiri (Sương Mù), Iwa (Đá) và Kumo (Mây). Sức mạnh dựa trên Chakra - dung hợp từ năng lượng tinh thần và thể chất, chia thành 5 hệ cơ bản. Lực lượng mạnh mẽ nhất và cũng là tai ương của thế giới chính là các Vĩ Thú (Bijuu) - 9 thực thể mang sức mạnh cuồng nộ vô biên, bị phong ấn vào cơ thể con người gọi là Jinchuriki. Máu, nước mắt, hận thù gia tộc và ý chí của Lửa (Hi no Ishi) là những yếu tố cốt lõi.',
    majorFactions: ['Ngũ Đại Quốc / Ngũ Đại Nhẫn Thôn', 'Tổ Chức Akatsuki', 'Nhẫn Giả Lưu Vong (Missing-nin)', 'Gia Tộc Uchiha', 'Gia Tộc Senju', 'Làng Âm Thanh (Oto)'],
    image: 'https://images.unsplash.com/photo-1578589318433-30b5ea5ebdf5?auto=format&fit=crop&q=80&w=1000',
    powerSystem: 'Chakra / Nhẫn - Thể - Ảo / Huyết Kế Giới Hạn',
    currencyName: 'Ryo',
    baseStats: ['Thể lực', 'Chakra', 'Nhẫn Thuật', 'Thể Thuật', 'Ảo Thuật'],
    backgrounds: [
      { name: 'Học Viện Nhẫn Giả Bình Thường', rarity: 'Common' },
      { name: 'Kẻ Lang Thang / Nhẫn Giả Lưu Vong', rarity: 'Common' },
      { name: 'Gia Tộc Suy Vong', rarity: 'Rare' },
      { name: 'Tân Binh Làng Âm Thanh', rarity: 'Rare' },
      { name: 'Khí Tử Akatsuki', rarity: 'Epic' },
      { name: 'Người Dòng Dõi Hokage', rarity: 'Epic' },
      { name: 'Trọng Sinh / Xuyên Không', rarity: 'Legendary' },
      { name: 'Jinchuriki (Jinchūriki) Của Vĩ Thú', rarity: 'Legendary' }
    ],
    powers: [
      { name: 'Thể Thuật / Nhẫn Cụ Cơ Bản', rarity: 'Common' },
      { name: 'Phá Nguyên Độn Chú (Năng Lực Hỗ Trợ Mới Lạ)', rarity: 'Common' },
      { name: 'Nhẫn Thuật Nguyên Tố Ngẫu Nhiên', rarity: 'Rare' },
      { name: 'Ảo Thuật Đặc Thù', rarity: 'Rare' },
      { name: 'Huyết Kế Giới Hạn Nguyên Tố (VD: Băng, Dung, Từ)', rarity: 'Epic' },
      { name: 'Khế Ước Triệu Hồi Linh Thú Thượng Cổ', rarity: 'Epic' },
      { name: 'Tiên Nhân Thuật (Senjutsu Cổ Đại)', rarity: 'Legendary' },
      { name: 'Huyết Kế Giới Hạn Đặc Thù (Mộc Độn / Trần Độn)', rarity: 'Legendary' },
      { name: 'Nhãn Thuật Tối Thượng (Sharingan / Byakugan / Rinnegan)', rarity: 'Legendary' }
    ]
  },
  'xianxia': {
    id: 'xianxia',
    name: 'Tu Tiên Giới',
    type: 'tu_tien',
    description: 'Thế giới nơi phàm nhân có thể thông qua tu luyện, đoạt thiên địa tạo hoá để phi thăng thành Tiên, trường sinh bất lão.',
    settingDetails: 'Một thế giới vô ngần, cá lớn nuốt cá bé, nguy cơ tứ phía. Bao gồm vô số đại lục, tinh vực trường tồn vạn cổ. Ở đây, quy luật chân lý duy nhất là sức mạnh (Nhược nhục cường thực). Hệ thống tu luyện gian nan trắc trở chia thành nhiều tầng cảnh giới từ Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Hóa Thần trải dài cho tới Độ Kiếp Phi Thăng. Tu tiên giả sử dụng pháp bảo cường đại, phù lục thần bí, luyện chế đan dược cướp đoạt sinh cơ của trời đất. Mạng người như cỏ rác, thiên đạo vô tình, một lời không hợp là diệt cả gia tộc.',
    majorFactions: ['Thập Đại Tiên Môn / Thánh Địa', 'Ma Đạo Tông Môn', 'Tán Tu Liên Minh', 'Yêu Tộc Đại Ngàn', 'Thượng Cổ Thế Gia'],
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000',
    powerSystem: 'Linh Lực / Thần Thức / Pháp Pháp - Đạo Cảnh',
    currencyName: 'Linh Thạch',
    baseStats: ['Khí huyết', 'Thần Thức', 'Linh Căn', 'Thể Chất', 'Ngộ Tính'],
    backgrounds: [
      { name: 'Tạp Dịch Đệ Tử', rarity: 'Common' },
      { name: 'Tán Tu Mạt Hạng', rarity: 'Common' },
      { name: 'Kẻ Nhặt Rác', rarity: 'Common' },
      { name: 'Thiếu Gia Nửa Mùa Gia Tộc Nhỏ', rarity: 'Rare' },
      { name: 'Khách Khanh Ma Đạo', rarity: 'Rare' },
      { name: 'Chân Truyền Đệ Tử Thánh Địa', rarity: 'Epic' },
      { name: 'Cô Nhi Thượng Cổ Gia Tộc', rarity: 'Epic' },
      { name: 'Tiên Tôn / Ma Tôn Trùng Sinh', rarity: 'Legendary' },
      { name: 'Con Của Khí Vận (Son of Heaven)', rarity: 'Legendary' }
    ],
    powers: [
      { name: 'Ngũ Hành Nhân Linh Căn', rarity: 'Common' },
      { name: 'Thể Thuật Luyện Cốt Ngoại Công', rarity: 'Common' },
      { name: 'Đơn Dị Linh Căn (Hỏa/Thủy/Mộc)', rarity: 'Rare' },
      { name: 'Khí Linh Bí Cảnh Cổ Đại', rarity: 'Rare' },
      { name: 'Bẩm Sinh Kiếm Tâm Thông Minh', rarity: 'Epic' },
      { name: 'Biến Dị Linh Căn (Lôi/Băng/Phong)', rarity: 'Epic' },
      { name: 'Hỗn Độn Thể / Hoang Cổ Thánh Thể', rarity: 'Legendary' },
      { name: 'Dị Hỏa Bảng Tối Cường', rarity: 'Legendary' },
      { name: 'Truyền Thừa Công Pháp Của Tiên Đế', rarity: 'Legendary' }
    ]
  },
  'harry-potter': {
    id: 'harry-potter',
    name: 'Học Viện Phép Thuật (Harry Potter)',
    type: 'magic',
    description: 'Thế giới phép thuật ẩn mình bên trong xã hội người thường (Muggle). Nơi ma lực sinh ra bùa chú, chổi bay và lọ độc dược.',
    settingDetails: 'Thế giới song song lấy bối cảnh ở Anh Quốc, nơi cộng đồng phù thủy phát triển một xã hội độc lập có Đạo luật Bí mật Quốc tế để che giấu danh tính trước người thường (Muggle). Trọng tâm là Học viện Pháp thuật và Ma thuật Hogwarts với 4 nhà: Gryffindor, Slytherin, Ravenclaw, Hufflepuff. Câu chuyện bao trùm bởi cuộc chiến dai dẳng giữa Hội Phượng Hoàng đại diện cho hòa bình và lực lượng Tử Thần Thực Tử dẫn đầu bởi Chúa tể Hắc ám Voldemort. Ranh giới về dòng máu thuần chủng và người lai luôn là ngọn nguồn của mọi định kiến và xung đột pháp thuật.',
    majorFactions: ['Bộ Pháp Thuật', 'Học Viện Hogwarts', 'Tử Thần Thực Tử (Hắc Ám)', 'Hội Phượng Hoàng', 'Bầy Sói Mang Lốt Người / Yêu Tinh Gringotts'],
    image: 'https://images.unsplash.com/photo-1618944847023-38aa001235f0?auto=format&fit=crop&q=80&w=1000',
    powerSystem: 'Ma Lực / Bùa Chú / Đũa Phép',
    currencyName: 'Galleon',
    baseStats: ['Ma Lực', 'Trí Tuệ', 'Sự Biến Hóa', 'Bùa Chú', 'Độc Dược'],
    backgrounds: [
      { name: 'Muggle-born (Máu Bùn)', rarity: 'Common' },
      { name: 'Phù Thủy Con Lai (Half-blood)', rarity: 'Common' },
      { name: 'Học Sinh Chuyển Trường Lạc Lõng', rarity: 'Common' },
      { name: 'Phù Thủy Thuần Chủng Vô Danh', rarity: 'Rare' },
      { name: 'Hậu Duệ Tử Thần Thực Tử', rarity: 'Rare' },
      { name: 'Trẻ Mồ Côi Có Năng Lực Cổ Đại', rarity: 'Epic' },
      { name: 'Gia Tộc Black / Malfoy Nhánh Phụ', rarity: 'Epic' },
      { name: 'Người Thừa Kế Kẻ Sáng Lập Hogwarts', rarity: 'Legendary' }
    ],
    powers: [
      { name: 'Khả Năng Thích Ứng Phép Thuật Nhanh', rarity: 'Common' },
      { name: 'Sợi Đũa Phép Phản Kháng Lạ Thường', rarity: 'Common' },
      { name: 'Tài Năng Độc Dược Thiết Yếu', rarity: 'Rare' },
      { name: 'Bậc Thầy Bay Lượn Truy Tìm', rarity: 'Rare' },
      { name: 'Hóa Thú Sư (Animagus)', rarity: 'Epic' },
      { name: 'Khả Năng Giao Tiếp Bằng Xà Ngữ (Parseltongue)', rarity: 'Epic' },
      { name: 'Nhãn Tự Chiêm Tinh / Tiên Tri Thần Bí', rarity: 'Epic' },
      { name: 'Pháp Sư Không Cần Đũa Khắc Ấn Cổ Đại (Wandless Master)', rarity: 'Legendary' },
      { name: 'Nắm Giữ Nguyên Lý Hắc Ma Thuật Chân Nguyên', rarity: 'Legendary' }
    ]
  }
};
