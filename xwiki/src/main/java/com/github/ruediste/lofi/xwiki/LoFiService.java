package com.github.ruediste.lofi.xwiki;

import org.xwiki.component.annotation.Role;
import org.xwiki.model.reference.DocumentReference;

@Role
public interface LoFiService {

    String getPageImageUrl(String attachment, int pageNr);

    String getMockupManagementUrl();

    String getMockupEditUrl(String attachment, int pageNr);

    String getMockupPlayUrl(String attachment, int pageNr);

    String getMockupManagementUrl(DocumentReference document);

    String getWebjarUrl();

}