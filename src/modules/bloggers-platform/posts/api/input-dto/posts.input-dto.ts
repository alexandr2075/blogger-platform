export class CreatePostInputDto {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
}

export class CreatePostInputDtoWithBlogName {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
}
